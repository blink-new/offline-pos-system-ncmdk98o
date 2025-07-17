import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  AlertTriangle,
  Eye,
  BarChart3
} from 'lucide-react';
import { db, Product, Transaction } from '@/lib/database';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface DashboardStats {
  todaySales: number;
  todayTransactions: number;
  totalProducts: number;
  totalCustomers: number;
  lowStockItems: Product[];
  recentTransactions: Transaction[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0,
    todayTransactions: 0,
    totalProducts: 0,
    totalCustomers: 0,
    lowStockItems: [],
    recentTransactions: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get today's transactions using timestamps
        const todayTransactions = await db.transactions
          .where('timestamp')
          .between(today.getTime(), tomorrow.getTime())
          .and(transaction => transaction.status === 'completed')
          .toArray();

        // Calculate today's sales
        const todaySales = todayTransactions.reduce((sum, transaction) => sum + transaction.total, 0);

        // Get total counts
        const totalProducts = await db.products.count();
        const totalCustomers = await db.customers.count();

        // Get low stock items
        const allProducts = await db.products.toArray();
        const lowStockItems = allProducts
          .filter(product => product.currentStock <= product.minStockLevel)
          .slice(0, 5);

        // Get recent transactions
        const recentTransactions = await db.transactions
          .orderBy('timestamp')
          .reverse()
          .limit(5)
          .toArray();

        setStats({
          todaySales,
          todayTransactions: todayTransactions.length,
          totalProducts,
          totalCustomers,
          lowStockItems,
          recentTransactions
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-1">
          Welcome back! Here's what's happening in your store today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.todaySales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.todayTransactions} transactions today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayTransactions}</div>
            <p className="text-xs text-muted-foreground">
              Completed today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Total in inventory
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Registered customers
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.lowStockItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No low stock items</p>
            ) : (
              <div className="space-y-3">
                {stats.lowStockItems.map((product) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={product.currentStock === 0 ? "destructive" : "secondary"}>
                        {product.currentStock} left
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        Min: {product.minStockLevel}
                      </p>
                    </div>
                  </div>
                ))}
                <Link to="/inventory">
                  <Button variant="outline" size="sm" className="w-full mt-3">
                    <Eye className="h-4 w-4 mr-2" />
                    View Inventory
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent transactions</p>
            ) : (
              <div className="space-y-3">
                {stats.recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{transaction.transactionId}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(transaction.timestamp), 'MMM dd, HH:mm')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${transaction.total.toFixed(2)}</p>
                      <Badge 
                        variant={
                          transaction.status === 'completed' ? 'default' :
                          transaction.status === 'voided' ? 'destructive' : 'secondary'
                        }
                        className="text-xs"
                      >
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                <Link to="/reports">
                  <Button variant="outline" size="sm" className="w-full mt-3">
                    <Eye className="h-4 w-4 mr-2" />
                    View All Reports
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/sales">
              <Button className="w-full h-16 flex flex-col items-center justify-center">
                <ShoppingCart className="h-6 w-6 mb-1" />
                New Sale
              </Button>
            </Link>
            <Link to="/products">
              <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center">
                <Package className="h-6 w-6 mb-1" />
                Add Product
              </Button>
            </Link>
            <Link to="/customers">
              <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center">
                <Users className="h-6 w-6 mb-1" />
                Add Customer
              </Button>
            </Link>
            <Link to="/reports">
              <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center">
                <BarChart3 className="h-6 w-6 mb-1" />
                View Reports
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}