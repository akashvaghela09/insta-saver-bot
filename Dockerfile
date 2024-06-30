FROM node:18.0.0-buster-slim

# Set environment variables for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV PUPPETEER_EXECUTABLE_PATH /usr/bin/google-chrome

# Install necessary tools and dependencies
RUN apt-get update && apt-get install -y \
  curl \
  gnupg \
  ca-certificates \
  && curl --location --silent https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
  && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
  google-chrome-stable \
  && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps --production

# Copy the rest of the application code
COPY . .

# Expose port
EXPOSE 8080

# Command to run the application
CMD ["npm", "start"]