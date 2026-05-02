# Use Nginx to serve static files
FROM nginx:alpine

# Copy the static files to the Nginx html directory
COPY . /usr/share/nginx/html

# Expose port 8080 (Cloud Run default)
EXPOSE 8080

# Configure Nginx to listen on 8080
RUN sed -i 's/listen\(.*\)80;/listen 8080;/g' /etc/nginx/conf.d/default.conf

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
