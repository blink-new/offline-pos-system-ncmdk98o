import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  User,
  Receipt,
  Scan
} from 'lucide-react';
import { db, Product, Customer, Transaction, TransactionItem, generateTransactionId } from '@/lib/database';

interface CartItem extends TransactionItem {
  product: Product;
}

export default function Sales() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  // Tax rate (should come from settings)
  const TAX_RATE = 0.085; // 8.5%

  const loadProducts = useCallback(async () => {
    try {
      const allProducts = await db.products.toArray();
      setProducts(allProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (product: Product) => {
    if (product.currentStock <= 0) {
      toast({
        title: "Out of Stock",
        description: `${product.name} is currently out of stock`,
        variant: "destructive"
      });
      return;
    }

    const existingItem = cart.find(item => item.productId === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.currentStock) {
        toast({
          title: "Insufficient Stock",
          description: `Only ${product.currentStock} units available`,
          variant: "destructive"
        });
        return;
      }
      updateCartItemQuantity(product.id!, existingItem.quantity + 1);
    } else {
      const cartItem: CartItem = {
        productId: product.id!,
        sku: product.sku,
        name: product.name,
        quantity: 1,
        unitPrice: product.unitPrice,
        total: product.unitPrice,
        taxRate: TAX_RATE,
        product
      };
      setCart([...cart, cartItem]);
    }
  };

  const updateCartItemQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = products.find(p => p.id === productId);
    if (product && newQuantity > product.currentStock) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${product.currentStock} units available`,
        variant: "destructive"
      });
      return;
    }

    setCart(cart.map(item => 
      item.productId === productId 
        ? { ...item, quantity: newQuantity, total: newQuantity * item.unitPrice }
        : item
    ));
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = subtotal * TAX_RATE;
  const total = subtotal + taxAmount;

  const processTransaction = async () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to cart before processing",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);
    
    try {
      // Create transaction
      const transaction: Omit<Transaction, 'id'> = {
        transactionId: generateTransactionId(),
        customerId: selectedCustomer?.id,
        items: cart.map(item => ({
          productId: item.productId,
          sku: item.sku,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
          taxRate: item.taxRate
        })),
        subtotal,
        taxAmount,
        discountAmount: 0,
        total,
        paymentMethod: 'cash',
        status: 'completed',
        timestamp: new Date(),
        cashierId: 'admin' // In a real app, this would come from auth
      };

      // Save transaction
      await db.transactions.add(transaction);

      // Update product stock
      for (const item of cart) {
        const product = await db.products.get(item.productId);
        if (product) {
          await db.products.update(item.productId, {
            currentStock: product.currentStock - item.quantity
          });
        }
      }

      // Update customer loyalty points if customer selected
      if (selectedCustomer) {
        const pointsEarned = Math.floor(total); // 1 point per dollar
        await db.customers.update(selectedCustomer.id!, {
          loyaltyPoints: selectedCustomer.loyaltyPoints + pointsEarned,
          lastPurchase: new Date()
        });
      }

      toast({
        title: "Transaction Completed",
        description: `Transaction ${transaction.transactionId} processed successfully`,
      });

      // Clear cart and refresh products
      clearCart();
      loadProducts();

    } catch (error) {
      console.error('Error processing transaction:', error);
      toast({
        title: "Transaction Failed",
        description: "Failed to process transaction. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Sales & Checkout</h1>
        <p className="text-slate-600 mt-1">Process sales transactions and manage your cart</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search Bar */}
          <Card>
            <CardContent className="p-4">
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search products by name, SKU, or barcode..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Scan className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{product.name}</h3>
                      <p className="text-sm text-slate-600">SKU: {product.sku}</p>
                      <p className="text-sm text-slate-500">{product.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-900">
                        ${product.unitPrice.toFixed(2)}
                      </p>
                      <Badge 
                        variant={product.currentStock > product.minStockLevel ? "default" : 
                                product.currentStock > 0 ? "secondary" : "destructive"}
                      >
                        {product.currentStock} in stock
                      </Badge>
                    </div>
                  </div>
                  <Button
                    onClick={() => addToCart(product)}
                    disabled={product.currentStock <= 0}
                    className="w-full"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-slate-500">No products found matching your search.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Cart Section */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Shopping Cart ({cart.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.length === 0 ? (
                <p className="text-center text-slate-500 py-8">Cart is empty</p>
              ) : (
                <>
                  {cart.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-slate-500">${item.unitPrice.toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateCartItemQuantity(item.productId, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateCartItemQuantity(item.productId, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 text-red-600 hover:text-red-700"
                          onClick={() => removeFromCart(item.productId)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="w-16 text-right">
                        <p className="font-medium text-sm">${item.total.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}

                  <Separator />

                  {/* Totals */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax ({(TAX_RATE * 100).toFixed(1)}%):</span>
                      <span>${taxAmount.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>Total:</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Customer Selection */}
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full">
                      <User className="h-4 w-4 mr-2" />
                      {selectedCustomer ? selectedCustomer.name : 'Select Customer (Optional)'}
                    </Button>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <Button
                      onClick={processTransaction}
                      disabled={processing}
                      className="w-full"
                      size="lg"
                    >
                      <Receipt className="h-4 w-4 mr-2" />
                      {processing ? 'Processing...' : 'Complete Sale'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={clearCart}
                      className="w-full"
                      size="sm"
                    >
                      Clear Cart
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}