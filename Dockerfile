# syntax=docker/dockerfile:1

#
# Stage 1: Base - Shared configuration
#
FROM php:8.4-fpm-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    postgresql-dev \
    postgresql-client \
    libzip-dev \
    oniguruma-dev \
    icu-dev \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    geos-dev \
    proj-dev \
    gdal-dev \
    linux-headers \
    $PHPIZE_DEPS

# Install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
    pdo_pgsql \
    pgsql \
    zip \
    bcmath \
    intl \
    gd \
    opcache \
    pcntl

# Install PostGIS extension
RUN pecl install redis \
    && docker-php-ext-enable redis

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

#
# Stage 2: Dependencies - Install dependencies
#
FROM base AS dependencies

# Copy composer files
COPY composer.json composer.lock ./

# Install production dependencies with caching
RUN --mount=type=cache,target=/root/.composer \
    composer install \
    --no-dev \
    --no-interaction \
    --no-scripts \
    --no-autoloader \
    --prefer-dist

#
# Stage 3: Frontend Builder - Build assets
#
FROM node:22-alpine AS frontend

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install node dependencies with caching
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Copy source files needed for build
COPY resources ./resources
COPY public ./public
COPY vite.config.ts tsconfig.json ./

# Build assets
RUN npm run build

#
# Stage 4: Production - Final production image
#
FROM base AS production

# Set production environment
ENV APP_ENV=production \
    APP_DEBUG=false \
    COMPOSER_ALLOW_SUPERUSER=1

# Production PHP configuration
COPY docker/php/production.ini /usr/local/etc/php/conf.d/production.ini

# Copy dependencies from dependencies stage
COPY --from=dependencies /var/www/html/vendor ./vendor

# Copy application files
COPY . .

# Copy built assets from frontend stage
COPY --from=frontend /app/public/build ./public/build

# Generate optimized autoloader
RUN composer dump-autoload --optimize --no-dev --classmap-authoritative

# Set permissions
RUN chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Create non-root user
USER www-data

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
    CMD php artisan octane:status || exit 1

# Expose port
EXPOSE 9000

# Default command
CMD ["php-fpm"]

#
# Stage 5: Octane - Production with Laravel Octane (optional)
#
FROM production AS octane

USER root

# Install additional dependencies for Octane
RUN apk add --no-cache supervisor

COPY docker/supervisor/octane.conf /etc/supervisor/conf.d/octane.conf

USER www-data

EXPOSE 8000

CMD ["/usr/bin/supervisord", "-n", "-c", "/etc/supervisor/conf.d/octane.conf"]
