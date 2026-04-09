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
const CategoriesSection = lazy(
  () => import('~/components/sections/CategoriesSection'),
);
const WhySection = lazy(
  () => import('~/components/sections/WhySection'),
);
const CampaignSection = lazy(
  () => import('~/components/sections/CampaignSection'),
);
const LookbookSection = lazy(
  () => import('~/components/sections/LookbookSection'),
);
const TestimonialsFooterSection = lazy(
  () => import('~/components/sections/TestimonialsFooterSection'),
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


export default function Homepage() {
  const data = useLoaderData<typeof loader>();
  const whyWrapperRef = useRef<HTMLDivElement>(null);
  const pearlBgRef = useRef<HTMLDivElement>(null);
  const campaignWrapperRef = useRef<HTMLDivElement>(null);
  const titaniumBgRef = useRef<HTMLDivElement>(null);

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

        // Pearl background fades in as the user scrolls into The Why section
        if (pearlBgRef.current && whyWrapperRef.current) {
          gsap.fromTo(
            pearlBgRef.current,
            {opacity: 0},
            {
              opacity: 1,
              ease: 'none',
              scrollTrigger: {
                trigger: whyWrapperRef.current,
                start: 'top 75%',
                end: 'top 15%',
                scrub: 1.5,
              },
            },
          );
        }

        // Titanium overlay fades in as Campaign enters the viewport
        if (titaniumBgRef.current && campaignWrapperRef.current) {
          gsap.fromTo(
            titaniumBgRef.current,
            {opacity: 0},
            {
              opacity: 1,
              ease: 'none',
              scrollTrigger: {
                trigger: campaignWrapperRef.current,
                start: 'top 80%',
                end: 'top 20%',
                scrub: 1,
              },
            },
          );
        }
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

      {/* Scrollable HTML overlay -- Hero through Categories (above canvas) */}
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
        {/* Extra hero breathing room -- pushes About section further down */}
        <div style={{height: '200vh'}} aria-hidden="true" />
        <ClientOnly>
          <Suspense fallback={<section style={{height: '100vh'}} />}>
            <AboutSection />
          </Suspense>
        </ClientOnly>
        <div style={{height: '0', background: '#000000'}} aria-hidden="true" />
        <ClientOnly>
          <Suspense fallback={<section style={{height: '300vh'}} />}>
            <BestSellersSection />
          </Suspense>
        </ClientOnly>
        <ClientOnly>
          <Suspense fallback={<section style={{height: '300vh'}} />}>
            <CategoriesSection />
          </Suspense>
        </ClientOnly>
      </div>

      {/* The Why section -- pearl light background */}
      <div
        ref={whyWrapperRef}
        style={{
          position: 'relative',
          zIndex: 1,
          margin: '0 -1rem',
        }}
      >
        <div
          ref={pearlBgRef}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: -1,
            pointerEvents: 'none',
            opacity: 0,
            background: 'linear-gradient(to bottom, #FCFBF8, #F3F1EC, #E8E6DF)',
          }}
        />
        <ClientOnly>
          <Suspense fallback={<section style={{height: '100vh'}} />}>
            <WhySection />
          </Suspense>
        </ClientOnly>
      </div>

      {/* Campaign section -- dark titanium background fades in on scroll */}
      <div
        ref={campaignWrapperRef}
        style={{
          position: 'relative',
          zIndex: 1,
          margin: '0 -1rem',
        }}
      >
        <div
          ref={titaniumBgRef}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: -1,
            pointerEvents: 'none',
            opacity: 0,
            background: 'linear-gradient(to bottom, #18181B, #27272A)',
          }}
        />
        <ClientOnly>
          <Suspense fallback={<section style={{height: '600vh'}} />}>
            <CampaignSection />
          </Suspense>
        </ClientOnly>
      </div>

      {/* Lookbook section -- horizontal focal gallery */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          margin: '0 -1rem',
        }}
      >
        <ClientOnly>
          <Suspense fallback={<section style={{height: '700vh'}} />}>
            <LookbookSection />
          </Suspense>
        </ClientOnly>
      </div>

      {/* Testimonials + Footer -- above canvas */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          margin: '0 -1rem',
        }}
      >
        <ClientOnly>
          <Suspense fallback={<section style={{height: '120vh'}} />}>
            <TestimonialsFooterSection />
          </Suspense>
        </ClientOnly>
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
