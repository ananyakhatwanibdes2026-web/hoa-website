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
const ContinuousBackdrop = lazy(
  () => import('~/components/global/ContinuousBackdrop'),
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
  const campaignWrapperRef = useRef<HTMLDivElement>(null);
  const bsTitleSectionRef = useRef<HTMLElement>(null);
  const bsTitleRef = useRef<HTMLDivElement>(null);
  const bsRuleRef = useRef<HTMLDivElement>(null);
  const bsEyebrowRef = useRef<HTMLDivElement>(null);
  const bsLetterRefs = useRef<HTMLSpanElement[]>([]);

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

        // Bestsellers title spacer: hairline + eyebrow + letter-staggered wordmark
        if (
          bsTitleSectionRef.current &&
          bsRuleRef.current &&
          bsEyebrowRef.current &&
          bsLetterRefs.current.length > 0
        ) {
          const letters = bsLetterRefs.current;

          gsap.set(bsRuleRef.current, {scaleX: 0, opacity: 0, transformOrigin: 'center'});
          gsap.set(bsEyebrowRef.current, {y: 14, opacity: 0});
          gsap.set(letters, {y: 34, opacity: 0});

          const tl = gsap.timeline({paused: true});
          tl.to(bsRuleRef.current,
            {scaleX: 1, opacity: 1, duration: 0.08, ease: 'power2.out'}, 0.00)
            .to(bsEyebrowRef.current,
              {y: 0, opacity: 1, duration: 0.10, ease: 'power2.out'}, 0.06)
            .to(letters,
              {y: 0, opacity: 1, duration: 0.18, stagger: 0.018, ease: 'power3.out'}, 0.10)
            // Empty tween guarantees the hold phase cannot be collapsed by GSAP.
            .to({}, {duration: 0.44}, 0.28)
            .to(letters,
              {y: -22, opacity: 0, duration: 0.14, stagger: 0.014, ease: 'power2.in'}, 0.72)
            .to(bsEyebrowRef.current,
              {y: -14, opacity: 0, duration: 0.10, ease: 'power2.in'}, 0.82)
            .to(bsRuleRef.current,
              {scaleX: 0, opacity: 0, transformOrigin: 'right center',
                duration: 0.08, ease: 'power2.in'}, 0.88);

          ScrollTrigger.create({
            trigger: bsTitleSectionRef.current,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.25,
            invalidateOnRefresh: true,
            animation: tl,
          });
        }

      });
    });
    return () => ctx?.revert();
  }, []);

  return (
    <>
      {/* Global continuous Canvas2D backdrop -- always-on, drives
          constellation/mist/aurora motifs by global scroll progress.
          Replaces CategoriesWeaveCanvas + WhyMistCanvas + ContinuousAuroraCanvas. */}
      <ClientOnly>
        <Suspense fallback={null}>
          <ContinuousBackdrop />
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
        <div id="section-hero">
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
        </div>
        {/* Extra hero breathing room -- pushes About section further down */}
        <div style={{height: '200vh'}} aria-hidden="true" />
        <div id="section-about" style={{marginTop: '-120vh'}}>
          <ClientOnly>
            <Suspense fallback={<section style={{height: '100vh'}} />}>
              <AboutSection />
            </Suspense>
          </ClientOnly>
        </div>
        {/* Bestsellers title card: hairline rule, eyebrow, letter-staggered wordmark */}
        <section
          id="section-bs-title"
          ref={bsTitleSectionRef}
          style={{height: '180vh', position: 'relative', pointerEvents: 'none', marginTop: '-120vh'}}
          aria-hidden="true"
        >
          <div style={{position: 'sticky', top: 0, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <div ref={bsTitleRef} style={{textAlign: 'center'}}>
              <div
                ref={bsRuleRef}
                style={{
                  width: '64px',
                  height: '1px',
                  margin: '0 auto 1.1rem',
                  background: 'linear-gradient(90deg, rgba(96,128,224,0) 0%, rgba(96,128,224,0.9) 50%, rgba(96,128,224,0) 100%)',
                  willChange: 'transform, opacity',
                }}
              />
              <div
                ref={bsEyebrowRef}
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 400,
                  fontSize: 'clamp(0.68rem, 0.95vw, 0.85rem)',
                  letterSpacing: '0.42em',
                  textTransform: 'uppercase',
                  color: 'rgba(140,170,240,0.72)',
                  marginBottom: '1rem',
                  willChange: 'transform, opacity',
                }}
              >
                House of An
              </div>
              <h2
                aria-hidden="true"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontWeight: 300,
                  fontSize: 'clamp(2.4rem, 8vw, 7.5rem)',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.96)',
                  lineHeight: 1,
                  textShadow: '0 0 24px rgba(156,165,255,0.22), 0 0 72px rgba(140,170,240,0.12)',
                  paddingLeft: '0.22em',
                  margin: 0,
                }}
              >
                {'BESTSELLERS'.split('').map((char, i) => (
                  <span
                    key={i}
                    ref={(el) => {
                      if (el) bsLetterRefs.current[i] = el;
                    }}
                    style={{
                      display: 'inline-block',
                      willChange: 'transform, opacity',
                    }}
                  >
                    {char}
                  </span>
                ))}
              </h2>
            </div>
          </div>
        </section>
        <div id="section-bestsellers" style={{marginTop: '-120vh'}}>
          <ClientOnly>
            <Suspense fallback={<section style={{height: '500vh'}} />}>
              <BestSellersSection />
            </Suspense>
          </ClientOnly>
        </div>
        <div id="section-categories" style={{marginTop: '-120vh'}}>
          <ClientOnly>
            <Suspense fallback={<section style={{height: '500vh'}} />}>
              <CategoriesSection />
            </Suspense>
          </ClientOnly>
        </div>
      </div>

      {/* The Why section */}
      <div
        id="section-why"
        ref={whyWrapperRef}
        style={{
          position: 'relative',
          zIndex: 1,
          margin: '-120vh -1rem 0',
        }}
      >
        <ClientOnly>
          <Suspense fallback={<section style={{height: '250vh'}} />}>
            <WhySection />
          </Suspense>
        </ClientOnly>
      </div>

      {/* Campaign section -- background now handled globally by ContinuousBackdrop */}
      <div
        id="section-campaign"
        ref={campaignWrapperRef}
        style={{
          position: 'relative',
          zIndex: 1,
          margin: '-120vh -1rem 0',
        }}
      >
        <ClientOnly>
          <Suspense fallback={<section style={{height: '500vh'}} />}>
            <CampaignSection />
          </Suspense>
        </ClientOnly>
      </div>

      {/* Lookbook section -- horizontal focal gallery */}
      <div
        id="section-lookbook"
        style={{
          position: 'relative',
          zIndex: 1,
          margin: '-120vh -1rem 0',
        }}
      >
        <ClientOnly>
          <Suspense fallback={<section style={{height: '800vh'}} />}>
            <LookbookSection />
          </Suspense>
        </ClientOnly>
      </div>

      {/* Testimonials + Footer -- above canvas */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          margin: '-120vh -1rem 0',
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
