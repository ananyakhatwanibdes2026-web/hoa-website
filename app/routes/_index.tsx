import {Await, useLoaderData, Link} from 'react-router';
import type {Route} from './+types/_index';
import {Suspense, lazy, useState, useEffect, useRef} from 'react';
import {Image} from '@shopify/hydrogen';
import type {
  FeaturedCollectionFragment,
  RecommendedProductsQuery,
} from 'storefrontapi.generated';
import {ProductItem} from '~/components/ProductItem';
import {MockShopNotice} from '~/components/MockShopNotice';

// Dynamic imports -- three/R3F/drei/fflate never enter the SSR bundle.
const EntrancePreloader = lazy(
  () => import('~/components/sections/EntrancePreloader'),
);
const HeroSection = lazy(
  () => import('~/components/sections/HeroSection'),
);
const AboutSection = lazy(
  () => import('~/components/sections/AboutSection'),
);
const BestSellersSection = lazy(
  () => import('~/components/sections/BestSellersSection'),
);
// Renders children only after browser mount so React.lazy never fires on the server.
function ClientOnly({children}: {children: React.ReactNode}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? <>{children}</> : null;
}

export const meta: Route.MetaFunction = () => {
  return [{title: 'Hydrogen | Home'}];
};

export async function loader(args: Route.LoaderArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context}: Route.LoaderArgs) {
  const [{collections}] = await Promise.all([
    context.storefront.query(FEATURED_COLLECTION_QUERY),
    // Add other queries here, so that they are loaded in parallel
  ]);

  return {
    isShopLinked: Boolean(context.env.PUBLIC_STORE_DOMAIN),
    featuredCollection: collections.nodes[0],
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  const recommendedProducts = context.storefront
    .query(RECOMMENDED_PRODUCTS_QUERY)
    .catch((error: Error) => {
      // Log query errors, but don't throw them so the page can still render
      console.error(error);
      return null;
    });

  return {
    recommendedProducts,
  };
}

const PLACEHOLDER_SECTIONS = [
  'CATEGORIES',
  'THE WHY',
  'CAMPAIGN',
  'LOOKBOOK',
  'TESTIMONIALS + FOOTER',
];

export default function Homepage() {
  const data = useLoaderData<typeof loader>();

  useEffect(() => {
    let ctx: any;
    Promise.all([
      import('gsap').then((m) => m.gsap),
      import('gsap/ScrollTrigger').then((m) => m.ScrollTrigger),
    ]).then(([gsap, ScrollTrigger]) => {
      gsap.registerPlugin(ScrollTrigger);
      ctx = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>('.hoa-section-label').forEach((el) => {
          gsap.fromTo(
            el,
            {opacity: 0, y: 20},
            {
              opacity: 1,
              y: 0,
              duration: 0.9,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: el,
                start: 'top 80%',
                toggleActions: 'play none none none',
              },
            },
          );
        });
      });
    });
    return () => ctx?.revert();
  }, []);

  return (
    <>
      <ClientOnly>
        <Suspense fallback={null}>
          <EntrancePreloader />
        </Suspense>
      </ClientOnly>

      {/* Scrollable HTML overlay */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          margin: '0 -1rem',
        }}
      >
        {data.isShopLinked ? null : <MockShopNotice />}
        <ClientOnly>
          <Suspense
            fallback={
              <section
                style={{height: '100vh', background: 'transparent'}}
              />
            }
          >
            <HeroSection />
          </Suspense>
        </ClientOnly>
        <ClientOnly>
          <Suspense fallback={<section style={{height: '100vh'}} />}>
            <AboutSection />
          </Suspense>
        </ClientOnly>
        <ClientOnly>
          <Suspense fallback={<section style={{height: '100vh'}} />}>
            <BestSellersSection />
          </Suspense>
        </ClientOnly>
        {PLACEHOLDER_SECTIONS.map((label) => (
          <section
            key={label}
            style={{
              height: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              padding: 0,
            }}
          >
            <span
              className="hoa-section-label"
              style={{
                color: 'var(--text-primary, #ffffff)',
                fontFamily: 'var(--font-display, "Cormorant Garamond", serif)',
                fontSize: '3rem',
                fontWeight: 300,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                display: 'inline-block',
                opacity: 0,
              }}
            >
              {label}
            </span>
          </section>
        ))}
      </div>
    </>
  );
}

function FeaturedCollection({
  collection,
}: {
  collection: FeaturedCollectionFragment;
}) {
  if (!collection) return null;
  const image = collection?.image;
  return (
    <Link
      className="featured-collection"
      to={`/collections/${collection.handle}`}
    >
      {image && (
        <div className="featured-collection-image">
          <Image
            data={image}
            sizes="100vw"
            alt={image.altText || collection.title}
          />
        </div>
      )}
      <h1>{collection.title}</h1>
    </Link>
  );
}

function RecommendedProducts({
  products,
}: {
  products: Promise<RecommendedProductsQuery | null>;
}) {
  return (
    <section
      className="recommended-products"
      aria-labelledby="recommended-products"
    >
      <h2 id="recommended-products">Recommended Products</h2>
      <Suspense fallback={<div>Loading...</div>}>
        <Await resolve={products}>
          {(response) => (
            <div className="recommended-products-grid">
              {response
                ? response.products.nodes.map((product) => (
                    <ProductItem key={product.id} product={product} />
                  ))
                : null}
            </div>
          )}
        </Await>
      </Suspense>
      <br />
    </section>
  );
}

const FEATURED_COLLECTION_QUERY = `#graphql
  fragment FeaturedCollection on Collection {
    id
    title
    image {
      id
      url
      altText
      width
      height
    }
    handle
  }
  query FeaturedCollection($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collections(first: 1, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...FeaturedCollection
      }
    }
  }
` as const;

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  fragment RecommendedProduct on Product {
    id
    title
    handle
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    featuredImage {
      id
      url
      altText
      width
      height
    }
  }
  query RecommendedProducts ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 4, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...RecommendedProduct
      }
    }
  }
` as const;
