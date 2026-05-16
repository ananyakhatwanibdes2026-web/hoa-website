import {useLoaderData} from 'react-router';
import type {Route} from './+types/shop';
import {Analytics} from '@shopify/hydrogen';
import {ProductItem} from '~/components/ProductItem';
import type {ProductItemFragment} from 'storefrontapi.generated';

const HANDLES = ['edge', 'sculpt', 'elite'] as const;
type Handle = (typeof HANDLES)[number];

export const meta: Route.MetaFunction = () => {
  return [{title: 'Hydrogen | Shop'}];
};

export async function loader({context}: Route.LoaderArgs) {
  const {storefront} = context;

  const results = await Promise.all(
    HANDLES.map((handle) =>
      storefront.query(SHOP_COLLECTION_QUERY, {variables: {handle}}),
    ),
  );

  const collections = HANDLES.map((handle, i) => ({
    handle,
    collection: results[i].collection,
  })).filter((c) => c.collection);

  return {collections};
}

export default function Shop() {
  const {collections} = useLoaderData<typeof loader>();

  return (
    <div className="shop">
      {collections.map(({handle, collection}) => {
        if (!collection) return null;
        return (
          <section
            key={handle}
            id={handle}
            className="collection"
            data-handle={handle}
          >
            <h1>{collection.title}</h1>
            {collection.description ? (
              <p className="collection-description">{collection.description}</p>
            ) : null}
            <div className="products-grid">
              {collection.products.nodes.map(
                (product: ProductItemFragment, index: number) => (
                  <ProductItem
                    key={product.id}
                    product={product}
                    loading={index < 4 ? 'eager' : undefined}
                  />
                ),
              )}
            </div>
            <Analytics.CollectionView
              data={{
                collection: {id: collection.id, handle: collection.handle},
              }}
            />
          </section>
        );
      })}
    </div>
  );
}

const SHOP_PRODUCT_FRAGMENT = `#graphql
  fragment MoneyShopProduct on MoneyV2 {
    amount
    currencyCode
  }
  fragment ProductItem on Product {
    id
    handle
    title
    featuredImage {
      id
      altText
      url
      width
      height
    }
    priceRange {
      minVariantPrice { ...MoneyShopProduct }
      maxVariantPrice { ...MoneyShopProduct }
    }
  }
` as const;

const SHOP_COLLECTION_QUERY = `#graphql
  ${SHOP_PRODUCT_FRAGMENT}
  query ShopCollection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      products(first: 24) {
        nodes { ...ProductItem }
      }
    }
  }
` as const;
