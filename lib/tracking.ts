// Client-side tracking utility for Facebook, Google Analytics, Snapchat, and TikTok pixels.

export interface PixelConfig {
  platform: 'facebook' | 'google' | 'snapchat' | 'tiktok';
  pixel_id: string;
  active: boolean;
}

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
    gtag: any;
    dataLayer: any;
    snaptr: any;
    ttq: any;
  }
}

// 1. Initialize Facebook Pixel
function initFacebook(pixelId: string) {
  if (typeof window === 'undefined') return;
  if (window.fbq) return;

  (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

  window.fbq('init', pixelId);
}

// 2. Initialize Google Analytics
function initGoogle(pixelId: string) {
  if (typeof window === 'undefined') return;
  if (window.gtag) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${pixelId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', pixelId);
}

// 3. Initialize Snapchat Pixel
function initSnapchat(pixelId: string) {
  if (typeof window === 'undefined') return;
  if (window.snaptr) return;

  (function (e: any, t: any, n: any) {
    if (e.snaptr) return;
    var a = (e.snaptr = function () {
      a.handleRequest ? a.handleRequest.apply(a, arguments) : a.queue.push(arguments);
    });
    a.queue = [];
    var r = t.createElement(n);
    r.async = !0;
    r.src = 'https://sc-static.net/sce/pixel/ps.js';
    var s = t.getElementsByTagName(n)[0];
    s.parentNode.insertBefore(r, s);
  })(window, document, 'script');

  window.snaptr('init', pixelId);
}

// 4. Initialize TikTok Pixel
function initTikTok(pixelId: string) {
  if (typeof window === 'undefined') return;
  if (window.ttq) return;

  (function (w: any, d: any, s: any) {
    var ttq = (w.ttq = w.ttq || []);
    ttq.methods = [
      'page',
      'track',
      'identify',
      'instances',
      'debug',
      'on',
      'off',
      'once',
      'ready',
      'alias',
      'group',
      'enableCookie',
      'disableCookie',
    ];
    ttq.setAndDefer = function (e: any, t: any) {
      e[t] = function () {
        e.push([t].concat(Array.prototype.slice.call(arguments, 0)));
      };
    };
    for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
    ttq.instance = function (e: any) {
      for (var t = ttq._i[e] || [], n = 0; n < ttq.methods.length; n++)
        ttq.setAndDefer(t, ttq.methods[n]);
      return t;
    };
    ttq._i = {};
    ttq._f = {};
    ttq._ts = 1 * new Date();
    ttq._r = 1;
    var a = d.createElement(s);
    a.async = !0;
    a.src = 'https://analytics.tiktok.com/i18n/pixel/sdk.js?sdkid=' + pixelId;
    var r = d.getElementsByTagName(s)[0];
    r.parentNode.insertBefore(a, r);
  })(window, document, 'script');

  window.ttq.load(pixelId);
}

// Initialize all active pixels
export function initPixels(pixels: PixelConfig[]) {
  if (typeof window === 'undefined') return;
  pixels.forEach((p) => {
    if (!p.active) return;
    try {
      switch (p.platform) {
        case 'facebook':
          initFacebook(p.pixel_id);
          break;
        case 'google':
          initGoogle(p.pixel_id);
          break;
        case 'snapchat':
          initSnapchat(p.pixel_id);
          break;
        case 'tiktok':
          initTikTok(p.pixel_id);
          break;
      }
    } catch (err) {
      console.error(`Failed to initialize pixel for ${p.platform}:`, err);
    }
  });
}

// Fire PageView event
export function trackPageView(pixels: PixelConfig[], url: string) {
  if (typeof window === 'undefined') return;
  pixels.forEach((p) => {
    if (!p.active) return;
    try {
      switch (p.platform) {
        case 'facebook':
          window.fbq('track', 'PageView');
          break;
        case 'google':
          if (window.gtag) {
            window.gtag('event', 'page_view', { page_path: url });
          }
          break;
        case 'snapchat':
          window.snaptr('track', 'PAGE_VIEW');
          break;
        case 'tiktok':
          window.ttq.page();
          break;
      }
    } catch (e) {}
  });
}

// Fire ViewContent event (Product / Box Detail)
export function trackViewContent(pixels: PixelConfig[], details: { id: string; name: string; value: number; type: 'product' | 'box' }) {
  if (typeof window === 'undefined') return;
  pixels.forEach((p) => {
    if (!p.active) return;
    try {
      switch (p.platform) {
        case 'facebook':
          window.fbq('track', 'ViewContent', {
            content_name: details.name,
            content_ids: [details.id],
            content_type: details.type,
            value: details.value,
            currency: 'EGP',
          });
          break;
        case 'google':
          if (window.gtag) {
            window.gtag('event', 'view_item', {
              currency: 'EGP',
              value: details.value,
              items: [{ item_id: details.id, item_name: details.name }],
            });
          }
          break;
        case 'snapchat':
          window.snaptr('track', 'VIEW_CONTENT', {
            description: details.name,
            item_ids: [details.id],
            price: details.value,
            currency: 'EGP',
          });
          break;
        case 'tiktok':
          window.ttq.track('ViewContent', {
            contents: [{ content_id: details.id, content_name: details.name, content_type: details.type }],
            value: details.value,
            currency: 'EGP',
          });
          break;
      }
    } catch (e) {}
  });
}

// Fire AddToCart event
export function trackAddToCart(pixels: PixelConfig[], item: { id: string; name: string; value: number; qty: number }) {
  if (typeof window === 'undefined') return;
  pixels.forEach((p) => {
    if (!p.active) return;
    try {
      switch (p.platform) {
        case 'facebook':
          window.fbq('track', 'AddToCart', {
            content_name: item.name,
            content_ids: [item.id],
            value: item.value * item.qty,
            currency: 'EGP',
          });
          break;
        case 'google':
          if (window.gtag) {
            window.gtag('event', 'add_to_cart', {
              currency: 'EGP',
              value: item.value * item.qty,
              items: [{ item_id: item.id, item_name: item.name, quantity: item.qty }],
            });
          }
          break;
        case 'snapchat':
          window.snaptr('track', 'ADD_CART', {
            description: item.name,
            item_ids: [item.id],
            price: item.value,
            number_items: item.qty,
            currency: 'EGP',
          });
          break;
        case 'tiktok':
          window.ttq.track('AddToCart', {
            contents: [{ content_id: item.id, content_name: item.name, quantity: item.qty }],
            value: item.value * item.qty,
            currency: 'EGP',
          });
          break;
      }
    } catch (e) {}
  });
}

// Fire InitiateCheckout event
export function trackInitiateCheckout(pixels: PixelConfig[], value: number, count: number) {
  if (typeof window === 'undefined') return;
  pixels.forEach((p) => {
    if (!p.active) return;
    try {
      switch (p.platform) {
        case 'facebook':
          window.fbq('track', 'InitiateCheckout', {
            value: value,
            currency: 'EGP',
            num_items: count,
          });
          break;
        case 'google':
          if (window.gtag) {
            window.gtag('event', 'begin_checkout', {
              currency: 'EGP',
              value: value,
            });
          }
          break;
        case 'snapchat':
          window.snaptr('track', 'START_CHECKOUT', {
            price: value,
            number_items: count,
            currency: 'EGP',
          });
          break;
        case 'tiktok':
          window.ttq.track('InitiateCheckout', {
            value: value,
            currency: 'EGP',
          });
          break;
      }
    } catch (e) {}
  });
}

// Fire Purchase event
export function trackPurchase(pixels: PixelConfig[], orderId: string, value: number, items: Array<{ id: string; name: string; qty: number; price: number }>) {
  if (typeof window === 'undefined') return;
  pixels.forEach((p) => {
    if (!p.active) return;
    try {
      switch (p.platform) {
        case 'facebook':
          window.fbq('track', 'Purchase', {
            content_ids: items.map(i => i.id),
            value: value,
            currency: 'EGP',
            order_id: orderId,
          });
          break;
        case 'google':
          if (window.gtag) {
            window.gtag('event', 'purchase', {
              transaction_id: orderId,
              value: value,
              currency: 'EGP',
              items: items.map(i => ({ item_id: i.id, item_name: i.name, quantity: i.qty, price: i.price })),
            });
          }
          break;
        case 'snapchat':
          window.snaptr('track', 'PURCHASE', {
            transaction_id: orderId,
            price: value,
            currency: 'EGP',
          });
          break;
        case 'tiktok':
          window.ttq.track('CompletePayment', {
            contents: items.map(i => ({ content_id: i.id, content_name: i.name, quantity: i.qty })),
            value: value,
            currency: 'EGP',
          });
          break;
      }
    } catch (e) {}
  });
}

// Client-side quick event dispatcher using global pixels
export function trackClientEvent(
  event: 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase',
  data: any
) {
  if (typeof window === 'undefined') return;
  const pixels = (window as any).activePixels as PixelConfig[];
  if (!pixels) return;

  switch (event) {
    case 'ViewContent':
      trackViewContent(pixels, data);
      break;
    case 'AddToCart':
      trackAddToCart(pixels, data);
      break;
    case 'InitiateCheckout':
      trackInitiateCheckout(pixels, data.value, data.count);
      break;
    case 'Purchase':
      trackPurchase(pixels, data.orderId, data.value, data.items);
      break;
  }
}

