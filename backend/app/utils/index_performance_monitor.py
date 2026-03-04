"""
Database Index Performance Monitoring
Tracks index usage, efficiency, and query performance metrics.
Provides admin dashboard data for database optimization.
"""
from app.configuration.extensions import db
from sqlalchemy import text
from datetime import datetime, timedelta
import logging
from typing import Dict, List, Optional
import time

logger = logging.getLogger(__name__)


class IndexPerformanceMonitor:
    """
    Monitor database index performance and query efficiency.
    Tracks index usage, helps identify missing or unused indexes.
    """

    @staticmethod
    def get_index_stats() -> Dict:
        """
        Get comprehensive index statistics from database.
        Returns usage metrics for all product-related indexes.
        Expected query time: 50-100ms
        """
        try:
            query = text("""
                SELECT
                    schemaname,
                    tablename,
                    indexname,
                    idx_scan as scan_count,
                    idx_tup_read as tuples_read,
                    idx_tup_fetch as tuples_fetched,
                    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
                    CASE 
                        WHEN idx_scan = 0 THEN 'UNUSED'
                        WHEN idx_scan < 10 THEN 'RARELY_USED'
                        WHEN idx_scan < 100 THEN 'LIGHTLY_USED'
                        WHEN idx_scan < 1000 THEN 'FREQUENTLY_USED'
                        ELSE 'VERY_FREQUENTLY_USED'
                    END as usage_level
                FROM pg_stat_user_indexes
                WHERE schemaname = 'public'
                    AND (tablename LIKE '%product%' OR tablename LIKE '%categor%')
                ORDER BY idx_scan DESC
            """)
            
            result = db.session.execute(query)
            indexes = []
            
            for row in result:
                indexes.append({
                    'schema': row[0],
                    'table': row[1],
                    'index_name': row[2],
                    'scan_count': row[3],
                    'tuples_read': row[4],
                    'tuples_fetched': row[5],
                    'size': row[6],
                    'usage_level': row[7],
                    'efficiency': round(
                        (row[5] / row[4]) * 100 if row[4] > 0 else 0, 2
                    )
                })
            
            return {
                'indexes': indexes,
                'total_indexes': len(indexes),
                'timestamp': datetime.now().isoformat()
            }
        
        except Exception as e:
            logger.error(f"Error fetching index stats: {e}")
            return {'indexes': [], 'total_indexes': 0, 'error': str(e)}

    @staticmethod
    def get_table_stats() -> Dict:
        """
        Get table statistics for product-related tables.
        Includes row counts, size, and bloat information.
        """
        try:
            query = text("""
                SELECT
                    schemaname,
                    tablename,
                    n_live_tup as live_rows,
                    n_dead_tup as dead_rows,
                    n_mod_since_analyze as mods_since_analyze,
                    last_vacuum,
                    last_analyze,
                    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size
                FROM pg_stat_user_tables
                WHERE schemaname = 'public'
                    AND (tablename LIKE '%product%' OR tablename LIKE '%categor%')
                ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
            """)
            
            result = db.session.execute(query)
            tables = []
            
            for row in result:
                dead_ratio = (row[3] / (row[2] + row[3]) * 100) if (row[2] + row[3]) > 0 else 0
                
                tables.append({
                    'schema': row[0],
                    'table': row[1],
                    'live_rows': row[2],
                    'dead_rows': row[3],
                    'modifications': row[4],
                    'last_vacuum': row[5].isoformat() if row[5] else None,
                    'last_analyze': row[6].isoformat() if row[6] else None,
                    'total_size': row[7],
                    'dead_ratio_pct': round(dead_ratio, 2),
                    'vacuum_needed': dead_ratio > 20
                })
            
            return {
                'tables': tables,
                'timestamp': datetime.now().isoformat()
            }
        
        except Exception as e:
            logger.error(f"Error fetching table stats: {e}")
            return {'tables': [], 'error': str(e)}

    @staticmethod
    def get_missing_indexes() -> Dict:
        """
        Identify potentially missing or inefficient indexes.
        Analyzes sequential scans and suggests indexes.
        """
        try:
            query = text("""
                SELECT
                    schemaname,
                    tablename,
                    attname as column_name,
                    n_distinct as distinct_values,
                    null_frac as null_fraction,
                    avg_width,
                    correlation
                FROM pg_stats
                WHERE schemaname = 'public'
                    AND (tablename LIKE '%product%' OR tablename LIKE '%categor%')
                    AND NOT inherited
                ORDER BY abs(correlation) DESC, n_distinct DESC
            """)
            
            result = db.session.execute(query)
            candidates = []
            
            for row in result:
                candidates.append({
                    'schema': row[0],
                    'table': row[1],
                    'column': row[2],
                    'distinct_values': row[3],
                    'null_fraction': round(float(row[4]) if row[4] else 0, 4),
                    'avg_width': row[5],
                    'correlation': round(float(row[6]) if row[6] else 0, 4)
                })
            
            return {
                'candidates': candidates,
                'timestamp': datetime.now().isoformat()
            }
        
        except Exception as e:
            logger.error(f"Error analyzing missing indexes: {e}")
            return {'candidates': [], 'error': str(e)}

    @staticmethod
    def get_cache_hit_ratio() -> Dict:
        """
        Get database cache hit ratios.
        Higher ratio indicates efficient caching and indexing.
        """
        try:
            query = text("""
                SELECT
                    sum(heap_blks_read) as heap_read,
                    sum(heap_blks_hit) as heap_hit,
                    sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as ratio
                FROM pg_statio_user_tables
                WHERE schemaname = 'public'
            """)
            
            result = db.session.execute(query)
            row = result.first()
            
            if row and row[2]:
                heap_ratio = float(row[2])
            else:
                heap_ratio = 0
            
            # Index cache hit ratio
            idx_query = text("""
                SELECT
                    sum(idx_blks_read) as idx_read,
                    sum(idx_blks_hit) as idx_hit,
                    sum(idx_blks_hit) / (sum(idx_blks_hit) + sum(idx_blks_read)) as ratio
                FROM pg_statio_user_indexes
                WHERE schemaname = 'public'
            """)
            
            idx_result = db.session.execute(idx_query)
            idx_row = idx_result.first()
            
            if idx_row and idx_row[2]:
                idx_ratio = float(idx_row[2])
            else:
                idx_ratio = 0
            
            return {
                'heap_cache_hit_ratio': round(heap_ratio * 100, 2),
                'index_cache_hit_ratio': round(idx_ratio * 100, 2),
                'overall_efficiency': 'EXCELLENT' if (heap_ratio + idx_ratio) / 2 > 0.95 else 'GOOD' if (heap_ratio + idx_ratio) / 2 > 0.9 else 'FAIR' if (heap_ratio + idx_ratio) / 2 > 0.8 else 'POOR',
                'timestamp': datetime.now().isoformat()
            }
        
        except Exception as e:
            logger.error(f"Error fetching cache hit ratios: {e}")
            return {'error': str(e)}

    @staticmethod
    def analyze_full_table_scans() -> Dict:
        """
        Identify tables with high sequential scan count.
        Indicates potential missing indexes.
        """
        try:
            query = text("""
                SELECT
                    schemaname,
                    tablename,
                    seq_scan as sequential_scans,
                    seq_tup_read as tuples_scanned,
                    idx_scan as index_scans,
                    CASE
                        WHEN idx_scan = 0 THEN 'ONLY_SEQUENTIAL'
                        WHEN seq_scan > idx_scan * 10 THEN 'MOSTLY_SEQUENTIAL'
                        WHEN seq_scan > idx_scan THEN 'MORE_SEQUENTIAL'
                        ELSE 'INDEX_PREFERRED'
                    END as scan_pattern
                FROM pg_stat_user_tables
                WHERE schemaname = 'public'
                    AND (tablename LIKE '%product%' OR tablename LIKE '%categor%')
                ORDER BY seq_scan DESC
            """)
            
            result = db.session.execute(query)
            scans = []
            
            for row in result:
                scans.append({
                    'schema': row[0],
                    'table': row[1],
                    'sequential_scans': row[2],
                    'tuples_scanned': row[3],
                    'index_scans': row[4],
                    'scan_pattern': row[5],
                    'needs_indexing': row[2] > row[4] * 5 if row[4] > 0 else row[2] > 1000
                })
            
            return {
                'scan_analysis': scans,
                'timestamp': datetime.now().isoformat()
            }
        
        except Exception as e:
            logger.error(f"Error analyzing table scans: {e}")
            return {'scan_analysis': [], 'error': str(e)}

    @staticmethod
    def get_performance_summary() -> Dict:
        """
        Get comprehensive performance summary for admin dashboard.
        Combines all metrics into actionable insights.
        """
        start_time = time.time()
        
        summary = {
            'index_stats': IndexPerformanceMonitor.get_index_stats(),
            'table_stats': IndexPerformanceMonitor.get_table_stats(),
            'cache_efficiency': IndexPerformanceMonitor.get_cache_hit_ratio(),
            'scan_analysis': IndexPerformanceMonitor.analyze_full_table_scans(),
            'query_time_ms': round((time.time() - start_time) * 1000, 2),
            'timestamp': datetime.now().isoformat()
        }
        
        return summary

    @staticmethod
    def get_index_recommendations() -> List[str]:
        """
        Generate recommendations based on index performance data.
        """
        recommendations = []
        
        try:
            # Check for unused indexes
            index_stats = IndexPerformanceMonitor.get_index_stats()
            unused_indexes = [
                idx for idx in index_stats.get('indexes', [])
                if idx['usage_level'] == 'UNUSED'
            ]
            
            if unused_indexes:
                recommendations.append(
                    f"Found {len(unused_indexes)} unused indexes. Consider dropping them to free up space."
                )
            
            # Check for high sequential scans
            scan_analysis = IndexPerformanceMonitor.analyze_full_table_scans()
            problematic_tables = [
                scan for scan in scan_analysis.get('scan_analysis', [])
                if scan['needs_indexing']
            ]
            
            if problematic_tables:
                recommendations.append(
                    f"Found {len(problematic_tables)} tables with high sequential scan counts. Consider additional indexing."
                )
            
            # Check cache hit ratio
            cache_stats = IndexPerformanceMonitor.get_cache_hit_ratio()
            if 'overall_efficiency' in cache_stats:
                if cache_stats['overall_efficiency'] == 'POOR':
                    recommendations.append("Database cache hit ratio is low. Monitor and optimize queries.")
            
            if not recommendations:
                recommendations.append("Database indexing strategy is optimal. No immediate recommendations.")
        
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            recommendations.append(f"Error generating recommendations: {str(e)}")
        
        return recommendations
