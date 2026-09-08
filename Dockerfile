FROM php:8.5-fpm-bookworm AS php-base

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    libpq-dev \
    libicu-dev \
    libzip-dev \
    unzip \
    && docker-php-ext-install -j"$(nproc)" \
    pdo_pgsql \
    bcmath \
    intl \
    zip \
    pcntl \
    && pecl install redis-6.3.0 \
    && docker-php-ext-enable redis \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer

RUN cp "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

WORKDIR /var/www/html

FROM php-base AS development

ARG DEV_UID=1000
ARG DEV_GID=1000
RUN groupmod -o -g "$DEV_GID" www-data \
    && usermod -o -u "$DEV_UID" -g "$DEV_GID" www-data \
    && cp "$PHP_INI_DIR/php.ini-development" "$PHP_INI_DIR/php.ini" \
    && echo 'opcache.enable=0' > "$PHP_INI_DIR/conf.d/development.ini"

FROM php-base AS app

COPY . .

RUN mkdir -p \
    storage/app/private \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    bootstrap/cache \
    && COMPOSER_ALLOW_SUPERUSER=1 composer install \
    --no-dev \
    --prefer-dist \
    --no-interaction \
    --optimize-autoloader \
    && chown -R www-data:www-data storage bootstrap/cache

CMD ["php-fpm"]

FROM nginx:stable-alpine AS web

COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=app /var/www/html/public /var/www/html/public
