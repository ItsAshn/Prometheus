# Prometheus Qwik Video Streaming App - Docker Deployment with Cloudflare Tunnel

This guide helps you deploy the Prometheus video streaming application using Docker and Docker Compose with Cloudflare Tunnel integration.

## Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)
- At least 4GB RAM and 20GB disk space recommended
- Existing Cloudflare Tunnel setup with the `cloudflareTunnel` Docker network

## Quick Start

1. **Ensure Cloudflare Tunnel Network Exists**:

   ```bash
   # Check if the cloudflareTunnel network exists
   docker network ls | grep cloudflareTunnel

   # If it doesn't exist, you need to create it or ensure your Cloudflare tunnel is properly configured
   ```

2. **Clone and setup environment**:

   ```bash
   # Copy the production environment template
   cp .env.production .env

   # Edit the .env file with your settings
   nano .env  # or use your preferred editor
   ```

3. **Important Security Configuration**:
   - Change `ADMIN_USERNAME` and `ADMIN_PASSWORD`
   - Generate a strong `JWT_SECRET` (minimum 32 characters)
   - Consider using a password manager to generate secure values

4. **Build and start the application**:

   ```bash
   # Deploy the application
   docker-compose up -d
   ```

5. **Configure Cloudflare Tunnel**:
   - Configure your Cloudflare tunnel to point to `prometheus-qwik-app:3000`
   - The application will be accessible through your Cloudflare tunnel domain

## Configuration Options

### Environment Variables

| Variable         | Description                       | Default                                 |
| ---------------- | --------------------------------- | --------------------------------------- |
| `ADMIN_USERNAME` | Admin login username              | `admin`                                 |
| `ADMIN_PASSWORD` | Admin login password              | `changeme123`                           |
| `JWT_SECRET`     | JWT signing secret (CHANGE THIS!) | `your-super-secret-jwt-key-change-this` |

### Volume Mounts

The application uses persistent volumes for:

- **video-data**: Stores uploaded and processed videos (`/app/public/videos`)
- **temp-data**: Temporary processing files (`/app/temp`)
- **app-data**: Application data and configuration (`/app/data`)

## Deployment Options

### Standard Deployment (With Cloudflare Tunnel)

```bash
docker-compose up -d
```

This starts the Qwik application and connects it to your existing Cloudflare Tunnel network.

### Development with Local Volumes

Uncomment the volume mounts in `docker-compose.yml` to use local directories:

```yaml
volumes:
  - ./public/videos:/app/public/videos
  - ./temp:/app/temp
```

## Cloudflare Tunnel Configuration

Your Cloudflare tunnel should be configured to route traffic to:

- **Service**: `prometheus-qwik-app:3000`
- **Network**: `cloudflareTunnel` (external Docker network)

Example tunnel configuration:

```yaml
tunnel: your-tunnel-id
credentials-file: /path/to/credentials.json

ingress:
  - hostname: your-domain.example.com
    service: http://prometheus-qwik-app:3000
  - service: http_status:404
```

## HTTPS and Security

With Cloudflare Tunnel:

- **HTTPS is handled by Cloudflare** - no need for local SSL certificates
- **DDoS protection** and other Cloudflare security features are automatically applied
- **Zero Trust Access** can be configured through Cloudflare dashboard

## Management Commands

```bash
# View logs
docker-compose logs -f qwik-app

# Restart services
docker-compose restart qwik-app

# Update the application
docker-compose pull
docker-compose up -d --build

# Backup data
docker run --rm -v prometheus-qwik-app_video-data:/data -v $(pwd):/backup alpine tar czf /backup/video-backup.tar.gz -C /data .

# Restore data
docker run --rm -v prometheus-qwik-app_video-data:/data -v $(pwd):/backup alpine tar xzf /backup/video-backup.tar.gz -C /data
```

## Monitoring and Health Checks

The application includes health checks:

- **Application**: Internal Docker health check on port 3000
- **External Access**: Through your Cloudflare tunnel domain

Monitor resource usage:

```bash
docker stats
```

Check Cloudflare tunnel status:

```bash
# If you're running cloudflared in Docker
docker logs your-cloudflare-tunnel-container
```

## Security Considerations

1. **Change default credentials** in `.env`
2. **Use strong JWT secret** (minimum 32 characters)
3. **Configure firewall** to only allow necessary ports
4. **Regular updates**: Keep Docker images updated
5. **Monitor logs** for suspicious activity
6. **Use HTTPS** in production with proper certificates

## Troubleshooting

### Common Issues

1. **Port already in use**:

   ```bash
   # Check what's using the port
   netstat -tulpn | grep :3000
   # Change PORT in .env file
   ```

2. **Permission issues**:

   ```bash
   # Fix volume permissions
   sudo chown -R 1001:1001 ./public/videos ./temp
   ```

3. **Out of disk space**:

   ```bash
   # Clean up Docker
   docker system prune -a
   # Clean up old video files
   ```

4. **Memory issues**:
   - Adjust resource limits in `docker-compose.yml`
   - Monitor with `docker stats`

### Logs and Debugging

```bash
# Application logs
docker-compose logs -f qwik-app

# Nginx logs
docker-compose logs -f nginx

# Enter container for debugging
docker-compose exec qwik-app sh
```

## Scaling and Performance

For high-traffic deployments:

1. **Use nginx caching** for static content
2. **Add load balancer** for multiple app instances
3. **Consider CDN** for video delivery
4. **Monitor resource usage** and scale accordingly

## Backup Strategy

Regular backups should include:

- Video files (`video-data` volume)
- Application configuration (`app-data` volume)
- Environment configuration (`.env` file)

Set up automated backups using cron jobs or backup services.

## Support

For issues and questions:

1. Check the application logs
2. Review this documentation
3. Check Docker and Docker Compose documentation
4. Create an issue in the project repository
