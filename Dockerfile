# Use a Node image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package files from the backend folder
COPY backend/package*.json ./backend/

# Install dependencies
RUN cd backend && npm install

# Copy the rest of the backend code
COPY backend/ ./backend/

# Expose the port your backend uses (e.g., 5000)
EXPOSE 5000

# Start the server
CMD ["node", "backend/index.js"]
FROM php:8.2-cli

WORKDIR /var/www

RUN apt-get update && apt-get install -y \
    git \
    curl \
    zip \
    unzip \
    libpng-dev \
    libonig-dev \
    libxml2-dev

RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

COPY backend/ .

RUN composer install --no-interaction --prefer-dist --optimize-autoloader

EXPOSE 8000

CMD php artisan serve --host=0.0.0.0 --port=8000
