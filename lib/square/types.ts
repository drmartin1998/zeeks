import { z } from "zod";

/**
 * Internal navigation category used by the NavBar component.
 */
export interface NavCategory {
  label: string;
  href: string;
  highlight?: boolean;
}

/**
 * A node in the hierarchical Shop-menu category tree.
 *
 * Extends the flat `NavCategory` with a nested `children` list so the
 * megamenu (desktop) and drilldown drawer (mobile) can render up to two
 * levels of subcategories below a top-level category. `children` is empty
 * (`[]`) for leaf categories, which render as direct navigable links.
 */
export interface NavCategoryNode {
  label: string;
  href: string;
  children: NavCategoryNode[];
  /** Derived: `children.length > 0`. Drives the expand/drilldown affordance. */
  hasChildren: boolean;
}

/**
 * The full nested structure passed to `NavBar` for rendering the Shop menu.
 *
 * `source` distinguishes a live-Square tree from an empty one (data
 * unavailable). When `source === "empty"`, `root` is `[]` and the Shop menu
 * is not rendered — no fabricated categories are ever shown.
 */
export interface CategoryTree {
  root: NavCategoryNode[];
  source: "square" | "empty";
}

/** Zod schema validating a single nested nav category node (recursive). */
export const NavCategoryNodeSchema: z.ZodType<NavCategoryNode> = z.lazy(() =>
  z.object({
    label: z.string().min(1),
    href: z.string().min(1),
    children: z.array(NavCategoryNodeSchema),
    hasChildren: z.boolean(),
  })
);

/** Zod schema validating the nested category-tree API response. */
export const CategoryTreeSchema = z.object({
  tree: z.array(NavCategoryNodeSchema),
});

/**
 * Raw Square Catalog API response shape for a CATEGORY object.
 * Mirrors Square's CatalogObject with type === "CATEGORY".
 */
export interface SquareCatalogCategory {
  id: string;
  type: "CATEGORY";
  categoryData: {
    name: string;
    /** Nested parent reference from Square API: { id?: string, ordinal?: number } */
    parentCategory?: {
      id?: string;
      ordinal?: number;
    };
    /** Whether the category is visible online */
    isTopLevel?: boolean;
    /** Channel IDs this category is assigned to in Square */
    channels?: string[];
    /** Whether this category is visible online (Square e-commerce setting) */
    onlineVisibility?: boolean;
  };
}

/**
 * Response from listing/searching catalog categories.
 */
export interface SquareCategoryResponse {
  objects?: SquareCatalogCategory[];
}

/**
 * Returns true if a Square category has no parent — i.e., it is a
 * top-level category suitable for navigation and category landing pages.
 *
 * Reusable across the application; use wherever you need to distinguish
 * top-level categories from sub-categories.
 */
export function isTopLevelCategory(sqCat: SquareCatalogCategory): boolean {
  // Square's explicit boolean flag takes priority when present
  if (typeof sqCat.categoryData.isTopLevel === "boolean") {
    return sqCat.categoryData.isTopLevel;
  }
  // Fall back: top-level = no parent id
  const pid = sqCat.categoryData.parentCategory?.id;
  return pid === undefined || pid === null || pid === "";
}

/**
 * Maps a Square catalog category object to the internal NavCategory type.
 * Uses the category name as the label and generates a slug-based href.
 */
export function mapSquareCategoryToNavCategory(
  sqCat: SquareCatalogCategory
): NavCategory {
  const name = sqCat.categoryData.name;
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return {
    label: name,
    href: `/categories/${slug}`,
  };
}

// ---------------------------------------------------------------------------
// Zod validation schemas for Square SDK responses (Constitution III, FR-008)
// ---------------------------------------------------------------------------

/** Validates raw Square catalog category objects. */
export const CatalogCategorySchema = z.object({
  id: z.string().min(1),
  type: z.literal("CATEGORY"),
  categoryData: z.object({
    name: z.string().min(1),
    parentCategory: z
      .object({
        id: z.string().optional(),
        ordinal: z.number().optional(),
      })
      .optional(),
    isTopLevel: z.boolean().optional(),
  }),
});

/** Validates raw Square catalog item objects. */
export const CatalogItemSchema = z.object({
  id: z.string().min(1),
  type: z.literal("ITEM"),
  itemData: z.object({
    name: z.string(),
    description: z.string().optional(),
    categories: z
      .array(z.object({ id: z.string() }))
      .optional(),
    variations: z
      .array(
        z.object({
          type: z.literal("ITEM_VARIATION"),
          itemVariationData: z
            .object({
              priceMoney: z
                .object({
                  amount: z.bigint().optional(),
                  currency: z.string().optional(),
                })
                .optional(),
            })
            .optional(),
        })
      )
      .optional(),
  }),
});

/** Validates a paginated Square catalog search response. */
export const CatalogSearchResponseSchema = z.object({
  objects: z.array(z.unknown()).optional(),
  cursor: z.string().optional(),
});

/** Validates the application-level Product shape passed to components. */
export const ProductSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string().min(1),
  categorySlug: z.string().min(1),
  subCategory: z.string().optional(),
  subCategorySlug: z.string().optional(),
  subCategorySlugs: z.array(z.string()).optional(),
  price: z.number().min(0),
  currency: z.string().default("USD"),
  imageUrl: z.string().optional(),
  gradient: z.string(),
  brand: z.string().optional(),
  availability: z.enum(["IN_STOCK", "OUT_OF_STOCK"]).optional(),
});

/** Application-level product type inferred from the Zod schema. */
export type Product = z.infer<typeof ProductSchema>;

// ---------------------------------------------------------------------------
// Product Detail Page types
// ---------------------------------------------------------------------------

/** A single product variation (e.g., size "Large", color "Red"). */
export interface ProductVariation {
  id: string;
  name: string;
  sku?: string;
  price: number;
  imageUrl?: string;
  inventoryCount?: number;
  isSoldOut?: boolean;
}

/** Zod schema for product variation validation. */
export const ProductVariationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  sku: z.string().optional(),
  price: z.number().min(0),
  imageUrl: z.string().optional(),
  inventoryCount: z.number().int().min(0).optional(),
  isSoldOut: z.boolean().optional(),
});

/** Category breadcrumb segment. */
export const CategoryBreadcrumbSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
});

export type CategoryBreadcrumb = z.infer<typeof CategoryBreadcrumbSchema>;

/** Inventory availability status. */
export const InventoryStatusSchema = z.enum([
  "IN_STOCK",
  "OUT_OF_STOCK",
  "UNKNOWN",
]);

export type InventoryStatus = z.infer<typeof InventoryStatusSchema>;

/** Enriched product data for the product detail page. */
export const ProductDetailSchema = ProductSchema.extend({
  slug: z.string().min(1),
  images: z.array(z.string()),
  variations: z.array(ProductVariationSchema),
  category: CategoryBreadcrumbSchema,
  subCategory: CategoryBreadcrumbSchema.optional(),
  // Full category path from top-level → deepest subcategory (top-level first).
  // Used by the product detail breadcrumb to render every level of the
  // hierarchy and to link the top-level segment to a valid listing route.
  categoryPath: z.array(CategoryBreadcrumbSchema).default([]),
  inventoryStatus: InventoryStatusSchema,
  relatedProducts: z.array(ProductSchema).default([]),
});

export type ProductDetail = z.infer<typeof ProductDetailSchema>;

/** Validates query parameters for the products Route Handler. */
export const SearchParamsSchema = z.object({
  slug: z.string().min(1),
  cursor: z.string().optional(),
});

/** Validates search query parameters for the products/search Route Handler. */
export const ProductSearchParamsSchema = z.object({
  q: z.string().min(1, "Search query is required"),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

/** Standard error response shape. */
export const ErrorResponseSchema = z.object({
  error: z.string().min(1),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

/**
 * Display-oriented product shape used by client components.
 * Subset of Product with only the fields needed for rendering.
 */
export interface DisplayProduct {
  slug: string;
  title: string;
  category: string;
  price: number;
  image?: string;
  gradient?: string;
  catalogObjectId?: string;
  variationId?: string;
  hasVariations?: boolean;
  minPrice?: number;
  maxPrice?: number;
  /** Manufacturer brand from the item's brand custom attribute, if any */
  brand?: string;
  /** Availability at the listing location; in stock if any variation is available */
  availability: "IN_STOCK" | "OUT_OF_STOCK";
}

// ---------------------------------------------------------------------------
// Square Customer types (Clerk-to-Square Customer Sync)
// ---------------------------------------------------------------------------

/** A customer in Square's CRM, returned from search or create. */
export interface SquareCustomer {
  id: string;
  givenName?: string;
  familyName?: string;
  emailAddress?: string;
}

/** Clerk webhook event payload with full user data. */
export interface ClerkWebhookEventPayload {
  type: string;
  data: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email_addresses: Array<{
      id: string;
      email_address: string;
    }>;
    primary_email_address_id: string | null;
    phone_numbers: Array<{
      id: string;
      phone_number: string;
    }>;
    primary_phone_number_id: string | null;
  };
}

/**
 * Category data for product listing pages.
 */
export interface CategoryDisplayData {
  slug: string;
  name: string;
  description: string;
  backgroundImage?: string;
}

// ---------------------------------------------------------------------------
// Dashboard types (Customer Account Dashboard)
// ---------------------------------------------------------------------------

/** Customer profile displayed on the account dashboard. */
export interface CustomerProfile {
  id: string;
  givenName: string | undefined;
  familyName: string | undefined;
  emailAddress: string | undefined;
  phoneNumber: string | undefined;
}

/** Loyalty account summary for the points card. */
export interface LoyaltySummary {
  balance: number;
  lifetimePoints: number;
}

/** Order summary for the orders table. */
export interface OrderSummary {
  id: string;
  closedAt: string | undefined;
  totalMoney: {
    amount: bigint | null | undefined;
    currency: string | undefined;
  };
  state: string;
}

/** Result of a paginated order fetch. */
export interface PaginatedOrdersResult {
  orders: OrderSummary[];
  nextCursor: string | null;
}

// ---------------------------------------------------------------------------
// Edit Profile types
// ---------------------------------------------------------------------------

/** Address fields for Square customer (default shipping address). */
export interface CustomerAddress {
  addressLine1: string | undefined;
  locality: string | undefined;
  administrativeDistrictLevel1: string | undefined;
  postalCode: string | undefined;
}

/** Full customer profile with address for the edit profile page. */
export interface CustomerProfileFull {
  id: string;
  givenName: string | undefined;
  familyName: string | undefined;
  emailAddress: string | undefined;
  phoneNumber: string | undefined;
  address: CustomerAddress;
}

/** Clerk user profile fields for comparison/sync. */
export interface ClerkProfile {
  firstName: string;
  lastName: string;
  primaryEmail: string | null;
  primaryPhone: string | null;
}

/** Shape returned by GET /api/account/profile. */
export interface ProfileResponse {
  squareProfile: CustomerProfileFull;
  clerkProfile: ClerkProfile | null;
  clerkError: string | null;
  mismatchDetected: boolean;
}

/** Zod schema for the phone field (E.164 or US format). */
export const PhoneSchema = z
  .string()
  .regex(
    /^(\+\d{7,15}|\(\d{3}\)\s\d{3}[-.]\d{4}|\d{3}[-.]\d{3}[-.]\d{4})$/,
    "Enter a valid phone number"
  )
  .optional()
  .or(z.literal(""));

/** Zod schema for the address section. */
export const AddressInputSchema = z.object({
  addressLine1: z.string().optional(),
  locality: z.string().optional(),
  administrativeDistrictLevel1: z.string().optional(),
  postalCode: z.string().optional(),
});

/** Zod schema for profile update input validation. */
export const UpdateProfileInputSchema = z.object({
  givenName: z.string().optional(),
  familyName: z.string().optional(),
  emailAddress: z.string().email("Invalid email address").optional().or(z.literal("")),
  phoneNumber: PhoneSchema,
  address: AddressInputSchema.optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, "Password must be at least 8 characters").optional().or(z.literal("")),
  confirmPassword: z.string().optional(),
}).refine(
  (data) => {
    if (data.newPassword && data.newPassword !== data.confirmPassword) {
      return false;
    }
    return true;
  },
  { message: "Passwords do not match", path: ["confirmPassword"] }
);

export type UpdateProfileInput = z.infer<typeof UpdateProfileInputSchema>;

/** Response from PUT /api/account/profile. */
export const ProfileUpdateResponseSchema = z.object({
  success: z.boolean(),
  squareError: z.string().nullable().optional(),
  clerkError: z.string().nullable().optional(),
  passwordError: z.string().nullable().optional(),
});

export type ProfileUpdateResponse = z.infer<typeof ProfileUpdateResponseSchema>;

/** Represents a single line item in the shopping cart. */
export interface CartLineItem {
  uid: string;
  catalogObjectId: string;
  variationId: string;
  name: string;
  imageUrl: string | null;
  quantity: string;
  unitPrice: { amount: number; currency: string };
  lineTotal: { amount: number; currency: string };
  isUnavailable: boolean;
}

/** Full cart state returned from getCart. */
export interface Cart {
  orderId: string;
  lineItems: CartLineItem[];
  subtotal: { amount: number; currency: string };
}

/** Input shape for the addToCart Server Action. */
export interface AddToCartInput {
  catalogObjectId: string;
  variationId: string;
  quantity: number;
  productSlug?: string;
  hasVariations?: boolean;
}

/** Result from addToCart Server Action. */
export interface AddToCartResult {
  success: boolean;
  lineItemCount: number;
  error: string | null;
  guestOrderId?: string;
}

/** Result from cart mutation Server Actions (update/remove). */
export interface CartMutationResult {
  success: boolean;
  lineItems: CartLineItem[];
  subtotal: { amount: number; currency: string };
  error: string | null;
}

/** Result from getCart. */
export interface GetCartResult {
  cart: Cart | null;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Checkout types (024-checkout-flow)
// ---------------------------------------------------------------------------

/** Input to the initiateCheckout server action. */
export const CheckoutInputSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  squareCustomerId: z.string().optional(),
});

export type CheckoutInput = z.infer<typeof CheckoutInputSchema>;

/** Result from the initiateCheckout server action. */
export interface CheckoutResult {
  success: boolean;
  paymentLinkUrl: string | null;
  error: string | null;
  errorCode: string | null;
}

/** Payment link returned by Square's paymentLinks.create(). */
export interface PaymentLink {
  id: string;
  url: string;
  orderId: string;
  version: number;
}

/** Query parameters from Square's return redirect. */
export interface OrderResultParams {
  status: "COMPLETED" | "CANCELLED" | null;
  transactionId: string | null;
}

// ---------------------------------------------------------------------------
// Navigation Location Bar types (001-nav-location-bar)
// ---------------------------------------------------------------------------

export interface SquareLocationHours {
  dayOfWeek: string;
  startLocalTime: string;
  endLocalTime: string;
}

export interface LocationBarData {
  cityState: string;
  hoursDisplay: string;
  status: "open" | "closing-soon" | "closed" | "closed-today";
  statusText: string;
}

export const LocationBarDataSchema = z.object({
  cityState: z.string().min(1),
  hoursDisplay: z.string().min(1),
  status: z.enum(["open", "closing-soon", "closed", "closed-today"]),
  statusText: z.string().min(1),
});

// ---------------------------------------------------------------------------
// Loyalty / Rewards Redemption types (027-rewards-redemption)
// ---------------------------------------------------------------------------

export interface LoyaltyAccount {
  id: string;
  balance: number;
  lifetimePoints: number;
  customerId: string;
  programId: string;
  enrolledAt: string | null;
}

export interface RewardTier {
  id: string;
  name: string;
  points: number;
  description: string | null;
  discountType: "FIXED_AMOUNT" | "FIXED_PERCENTAGE" | null;
  discountAmount: number | null;
  discountPercentage: string | null;
}

export interface LoyaltyReward {
  id: string;
  status: "ISSUED" | "REDEEMED" | "DELETED";
  loyaltyAccountId: string;
  rewardTierId: string;
  points: number;
  orderId: string | null;
  createdAt: string;
}

export interface LoyaltyProgramDetail {
  id: string;
  status: string;
  rewardTiers: RewardTier[];
}

export interface EarnedPoints {
  points: number | null;
  error: string | null;
}

export interface LoyaltyPanelData {
  account: LoyaltyAccount | null;
  program: LoyaltyProgramDetail | null;
  activeReward: LoyaltyReward | null;
  earnedPoints: EarnedPoints | null;
  error: string | null;
}

export const PaymentFormSchema = z.object({
  sourceId: z.string().min(1, "Payment token is required"),
  orderId: z.string().min(1),
  rewardTierId: z.string().optional().or(z.literal("")),
  loyaltyAccountId: z.string().optional().or(z.literal("")),
  billingName: z.string().min(1, "Name is required"),
  billingAddressLine1: z.string().min(1, "Address is required"),
  billingCity: z.string().min(1, "City is required"),
  billingState: z.string().length(2, "Use 2-letter state code"),
  billingPostalCode: z.string().min(5, "Valid ZIP code is required"),
  squareCustomerId: z.string().optional().or(z.literal("")),
  billingEmail: z.string().optional().or(z.literal("")).refine(
    (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    { message: "Enter a valid email address" }
  ),
});

export type PaymentFormInput = z.infer<typeof PaymentFormSchema>;

export interface PaymentResult {
  success: boolean;
  transactionId: string | null;
  orderId: string | null;
  error: string | null;
  errorCode: string | null;
}

export interface CheckoutData {
  order: Cart | null;
  loyaltyData: LoyaltyPanelData | null;
  profile: CustomerProfile | null;
  error: string | null;
}

export interface SelectRewardResult {
  success: boolean;
  rewardId?: string;
  error?: string;
}

export interface DeselectRewardResult {
  success: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// Order Confirmation Email (feature 037)
// ---------------------------------------------------------------------------

/** A single item in the order confirmation email. */
export interface EmailLineItem {
  name: string;
  quantity: number;
  /** Unit price in currency minor units (cents). */
  unitPrice: number;
  /** Line total in currency minor units (cents). */
  lineTotal: number;
}

/** The order confirmation email sent to a customer. */
export interface OrderConfirmationEmail {
  to: { email: string; name?: string };
  sender: { email: string; name: string };
  subject: string;
  htmlContent: string;
  textContent: string;
  orderId: string;
  lineItems: EmailLineItem[];
  subtotal: { amount: number; currency: string };
}

/** A Square webhook event notification (generalized). */
export interface SquareWebhookEvent<T = unknown> {
  type: string;
  event_id?: string;
  data: {
    type: string;
    id: string;
    object?: T;
  };
}

/** The `payment.updated` event payload object. */
export interface PaymentCompletedEventObject {
  payment?: {
    id?: string;
    order_id?: string;
    status?: string;
    /** The buyer's email address (most reliable recipient for the email). */
    buyerEmailAddress?: string;
  };
}

