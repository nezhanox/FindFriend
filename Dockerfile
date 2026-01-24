# Base PHP image
FROM php:8.4-cli-alpine AS base

RUN apk add --no-cache \
    postgresql-dev \
    libzip-dev \
    linux-headers \
    brotli-dev \
    $PHPIZE_DEPS \
    && docker-php-ext-install \
    pdo_pgsql \
    pgsql \
    zip \
    pcntl \
    opcache \
    && pecl install swoole redis \
    && docker-php-ext-enable swoole redis \
    && apk del $PHPIZE_DEPS \
    && apk add --no-cache brotli

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Dependencies stage
FROM base AS dependencies

COPY composer.json composer.lock ./
RUN composer install \
    --no-dev \
    --no-interaction \
    --prefer-dist \
    --optimize-autoloader \
    --no-scripts \
    --no-progress

# Frontend build stage (needs PHP for Laravel Vite plugin)
FROM dependencies AS frontend

# Install Node.js in PHP image
RUN apk add --no-cache nodejs npm

COPY package*.json ./
RUN npm ci

COPY . .

# Build args for Vite environment variables
ARG VITE_MAPBOX_TOKEN
ENV VITE_MAPBOX_TOKEN=$VITE_MAPBOX_TOKEN

RUN npm run build

# Production Octane stage
FROM base AS octane

RUN apk add --no-cache supervisor

COPY --from=dependencies /var/www/html/vendor ./vendor
COPY --from=frontend /var/www/html/public/build ./public/build
COPY . .

RUN mkdir -p \
    storage/framework/cache \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    bootstrap/cache \
    && touch storage/logs/laravel.log \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Octane config
COPY docker/octane/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD php artisan octane:status || exit 1

EXPOSE 8000

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]