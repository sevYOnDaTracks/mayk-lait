export type Role = 'customer' | 'admin';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'completed' | 'cancelled';
export interface ProductOption { id: string; name: string; priceModifier: number; available: boolean; position: number; }
export interface OptionGroup { id: string; name: string; required: boolean; multiple: boolean; position: number; options: ProductOption[]; }
export interface Product { id: string; name: string; slug: string; description: string; price: number; volume?: string; images: string[]; ingredients: string[]; allergens: string[]; available: boolean; featured: boolean; optionGroups: OptionGroup[]; createdAt?: unknown; updatedAt?: unknown; }
export interface CartSelection { groupId: string; groupName: string; options: ProductOption[]; }
export interface CartItem { id: string; productId: string; name: string; slug: string; image: string; volume?: string; basePrice: number; quantity: number; selections: CartSelection[]; unitPrice: number; }
export interface Address { id?: string; label: string; firstName: string; lastName: string; phone: string; line1: string; line2?: string; city: string; postalCode: string; instructions?: string; primary?: boolean; }
export interface AppUser { uid: string; firstName: string; lastName: string; email: string; phone: string; birthDate?: string; allergies?: string[]; intolerances?: string[]; photoURL?: string; photoPath?: string; role: Role; onboardingComplete?: boolean; disabled?: boolean; createdAt?: unknown; updatedAt?: unknown; }
