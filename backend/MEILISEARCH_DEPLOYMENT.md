# Deploying Meilisearch to Render - Step by Step Guide

## Prerequisites
- Render account (sign up at https://render.com if you don't have one)
- Git repository with your code

## Step 1: Create Meilisearch Service on Render

### Option A: Using the Dashboard (Easiest)

1. **Go to Render Dashboard**
   - Visit https://dashboard.render.com
   - Click the "New +" button in the top right

2. **Select "Web Service"**
   - Choose "Deploy an existing image from a registry"

3. **Configure the Docker Image**
   - Image URL: `getmeili/meilisearch:v1.10`
   - Click "Next"

4. **Service Configuration**
   - Name: `mizizi-meilisearch` (or your preferred name)
   - Region: Choose closest to your users (e.g., Oregon USA, Frankfurt EU)
   - Instance Type: **Starter ($7/month)** - Good to start, upgrade later if needed

5. **Environment Variables**
   Add these environment variables:
   ```
   MEILI_MASTER_KEY = [Generate a secure key - min 16 characters]
   MEILI_ENV = production
   MEILI_HTTP_ADDR = 0.0.0.0:7700
   MEILI_NO_ANALYTICS = true
   ```

   **To generate a secure MEILI_MASTER_KEY**, use:
   ```bash
   openssl rand -base64 32
   ```

6. **Add Persistent Disk**
   - Scroll to "Disks" section
   - Click "Add Disk"
   - Name: `meili-data`
   - Mount Path: `/meili_data`
   - Size: 10 GB (or more based on your needs)

7. **Advanced Settings**
   - Port: `7700`
   - Health Check Path: `/health` (optional)

8. **Click "Create Web Service"**
   - Render will start deploying your Meilisearch instance
   - Wait for deployment to complete (usually 2-3 minutes)

## Step 2: Get Your Meilisearch URL

After deployment completes:
- Your Meilisearch URL will be: `https://your-service-name.onrender.com`
- Copy this URL - you'll need it for your backend configuration

## Step 3: Update Backend Configuration

1. **Update your backend `.env` file:**
   ```env
   MEILISEARCH_URL=https://your-service-name.onrender.com
   MEILISEARCH_MASTER_KEY=your-generated-master-key
   ```

2. **If using Vercel for your Next.js app**, add environment variables:
   - Go to your Vercel project settings
   - Navigate to "Environment Variables"
   - Add:
     - `MEILISEARCH_URL` = `https://your-service-name.onrender.com`
     - `MEILISEARCH_MASTER_KEY` = your master key

## Step 4: Initialize Meilisearch

Run the setup script to configure fuzzy search:

```bash
# Make sure your .env has the new Render URL
python scripts/setup_meilisearch.py
```

This will:
- Create the products index
- Configure fuzzy search with typo tolerance
- Index all your products

## Step 5: Test Your Deployment

Test that Meilisearch is working:

```bash
# Check health
curl https://your-service-name.onrender.com/health

# Test search (replace with your master key)
curl -X POST 'https://your-service-name.onrender.com/indexes/products/search' \
  -H 'Authorization: Bearer YOUR_MASTER_KEY' \
  -H 'Content-Type: application/json' \
  --data-binary '{"q": "itel"}'
```

## Step 6: Deploy Your Backend

If your backend API is also on Render:
1. Update the backend service environment variables with the new Meilisearch URL
2. Redeploy your backend
3. Your fuzzy search is now live!

## Monitoring & Maintenance

### Check Logs
- Go to Render Dashboard → Your Meilisearch Service → Logs
- Monitor search queries and performance

### Scaling
- If you need more performance, upgrade to Standard plan ($25/month)
- Increase disk size if you have many products

### Backups
- Render automatically backs up your disk
- For manual backups, use Meilisearch's dump feature

## Costs

- **Starter Plan**: $7/month (512MB RAM, 0.5 CPU)
- **Disk**: Included in plan (10GB), $0.25/GB for additional
- **Bandwidth**: Free up to reasonable limits

## Troubleshooting

### Service won't start
- Check that MEILI_MASTER_KEY is at least 16 characters
- Verify the Docker image URL is correct

### Can't connect from backend
- Verify the URL is correct (https://)
- Check that MEILI_MASTER_KEY matches in both places
- Ensure backend has the updated environment variables

### Search not working
- Run the setup script again to reindex products
- Check Render logs for errors
- Verify fuzzy search settings were applied

## Security

- Never commit your MEILI_MASTER_KEY to Git
- Use environment variables for all sensitive data
- Consider adding IP restrictions in production
- Use HTTPS only (Render provides this by default)

## Next Steps

After deployment:
1. Test fuzzy search with misspellings
2. Monitor performance in Render dashboard
3. Set up alerts for downtime (optional)
4. Consider adding a custom domain (optional)

Your Meilisearch is now production-ready with Jumia-style fuzzy search!
