-- Supabase Schema for Al-Khodary E-Commerce
-- Run this in your Supabase SQL Editor to set up all tables.

create extension if not exists "uuid-ossp";

-- 1. categories table
create table if not exists categories (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    slug text not null unique,
    icon text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. products table
create table if not exists products (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    description text,
    price_unit numeric(10, 2) not null,
    price_box numeric(10, 2),
    category_id uuid references categories(id) on delete set null,
    images text[] not null default '{}',
    is_featured boolean default false,
    stock integer default 0,
    active boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. boxes table
create table if not exists boxes (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    stage text not null check (stage in ('kg', 'primary', 'middle', 'high')),
    base_price numeric(10, 2) not null,
    image text,
    description text,
    items jsonb not null default '[]'::jsonb, -- Array of {product_id, qty}
    active boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. coupons table
create table if not exists coupons (
    id uuid default uuid_generate_v4() primary key,
    code text not null unique,
    type text not null check (type in ('percentage', 'fixed')),
    value numeric(10, 2) not null,
    min_order numeric(10, 2) default 0.00,
    active boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. shipping_zones table
create table if not exists shipping_zones (
    id uuid default uuid_generate_v4() primary key,
    governorate_name text not null unique,
    price numeric(10, 2) not null,
    delivery_days integer not null default 3,
    free_shipping_threshold numeric(10, 2),
    active boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. orders table
create table if not exists orders (
    id uuid default uuid_generate_v4() primary key,
    customer_name text not null,
    phone text not null,
    governorate text not null,
    address text not null,
    items jsonb not null default '[]'::jsonb, -- Array of items (individual or customized boxes)
    subtotal numeric(10, 2) not null,
    shipping numeric(10, 2) not null,
    discount numeric(10, 2) default 0.00,
    total numeric(10, 2) not null,
    coupon_code text,
    status text not null default 'new' check (status in ('new', 'confirmed', 'with_courier', 'delivered', 'cancelled')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. pages table
create table if not exists pages (
    id uuid default uuid_generate_v4() primary key,
    slug text not null unique,
    title text not null,
    content jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. site_settings table
create table if not exists site_settings (
    id uuid default uuid_generate_v4() primary key,
    key text not null unique,
    value text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. contact_submissions table
create table if not exists contact_submissions (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    phone text not null,
    email text,
    message text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. tracking_pixels table
create table if not exists tracking_pixels (
    id uuid default uuid_generate_v4() primary key,
    platform text not null check (platform in ('facebook', 'google', 'snapchat', 'tiktok')),
    pixel_id text not null,
    active boolean default true,
    conversion_api_token text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
