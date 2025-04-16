import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Dimensions, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BarChart } from 'react-native-chart-kit';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import supabase from '../database/supabase';
import ParamList from '../navigation/Data';

const screenWidth = Dimensions.get('window').width;

type Order = {
  id: number;
  totalCost: number;
  ordertime: string;
};

type ShopSaleRouteProp = RouteProp<ParamList, 'ShopInterface'>;

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
};

export default function ShopSale() {
  const navigation = useNavigation();
  const route = useRoute<ShopSaleRouteProp>();
  const { idShop } = route.params;

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterDays, setFilterDays] = useState(7);
  const [selectedTab, setSelectedTab] = useState<'revenue' | 'orders' | 'avgRevenue'>('revenue');
  const [chartData, setChartData] = useState<{
    labels: string[];
    datasets: { data: number[] }[];
    formattedRevenues?: string[];
    formattedAvgRevenue?: string[];
  }>({
    labels: [],
    datasets: [{ data: [] }],
  });
  
  const fetchOrder = async () => {
    setIsLoading(true);
  
    const { data, error } = await supabase
      .from('Donhang')
      .select('id, totalCost, ordertime')
      .eq('shopId', idShop)
      .eq('status', 'Hoàn thành');
  
    if (error) {
      console.log('Unable to fetch order data: ', error.message);
    } else {
      const now = new Date();
      const filtered = data.filter((order: Order) => {
        const orderDate = new Date(order.ordertime);
        const diffTime = now.getTime() - orderDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        return diffDays <= filterDays;
      });
  
      const grouped: {
        [date: string]: {
          totalRevenue: number;
          orderCount: number;
        };
      } = {};
  
      filtered.forEach((order: Order) => {
        const date = new Date(order.ordertime);
        const formatted = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1)
          .toString()
          .padStart(2, '0')}`;
  
        if (!grouped[formatted]) {
          grouped[formatted] = {
            totalRevenue: order.totalCost,
            orderCount: 1,
          };
        } else {
          grouped[formatted].totalRevenue += order.totalCost;
          grouped[formatted].orderCount += 1;
        }
      });
  
      const labels = Object.keys(grouped).sort(
        (a, b) =>
          new Date(a.split('/').reverse().join('-')).getTime() -
          new Date(b.split('/').reverse().join('-')).getTime()
      );
  
      // Numeric values for chart data
      const revenues = labels.map((label) => grouped[label].totalRevenue);
      const ordersCount = labels.map((label) => grouped[label].orderCount);
      const avgRevenue = labels.map((label) =>
        grouped[label].orderCount > 0
          ? grouped[label].totalRevenue / grouped[label].orderCount
          : 0
      );
  
      // Format the revenue and avgRevenue values for display
      const formattedRevenues = revenues.map((revenue) => formatPrice(revenue));
      const formattedAvgRevenue = avgRevenue.map((revenue) => formatPrice(revenue));
  
      // Now, return number data for the chart and formatted data for display purposes
      const datasets =
        selectedTab === 'revenue'
          ? [{ data: revenues }]
          : selectedTab === 'orders'
          ? [{ data: ordersCount }]
          : [{ data: avgRevenue }];
  
      setChartData({
        labels,
        datasets,
        formattedRevenues, 
        formattedAvgRevenue, 
      });
    }
  
    setIsLoading(false);
  };
  
  

  useEffect(() => {
    fetchOrder();
  }, [idShop, filterDays, selectedTab]);

  return (
    <View style={styles.container}>
      {/* Header Container */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.goBackButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Doanh thu</Text>
      </View>

      {/* Body Container (Scrollable Section) */}
      <ScrollView contentContainerStyle={styles.bodyContainer}>
        <View style={styles.cardContainer}>
          {/* Filter Days Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Chọn thời gian</Text>
            <View style={styles.filterRow}>
              {[7, 30, 90].map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[styles.filterButton, filterDays === day && styles.filterButtonActive]}
                  onPress={() => setFilterDays(day)}
                >
                  <Text style={filterDays === day ? styles.filterTextActive : styles.filterText}>
                    {day} ngày
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Select Tab Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Chọn mục tin</Text>
            <View style={styles.tabRow}>
              {[
                { key: 'revenue', label: 'Tổng doanh số' },
                { key: 'orders', label: 'Tổng đơn hàng' },
                { key: 'avgRevenue', label: 'Doanh số/đơn' },
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tabButton, selectedTab === tab.key && styles.tabButtonActive]}
                  onPress={() => setSelectedTab(tab.key as any)}
                >
                  <Text style={selectedTab === tab.key ? styles.tabTextActive : styles.tabText}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color="#111111" style={styles.loading} />
        ) : chartData.labels.length > 0 ? (
          <View>
            <BarChart
              data={{
                labels: chartData.labels,
                datasets: chartData.datasets,
              }}
              width={screenWidth - 30}
              height={240}
              yAxisLabel=""
              yAxisSuffix=""
              fromZero
              chartConfig={{
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                labelColor: () => '#000',
                style: {
                  borderRadius: 8,
                },
                propsForDots: {
                  r: '6',
                  strokeWidth: '2',
                  stroke: '#fff', 
                },
              }}
              style={styles.chart}
              showValuesOnTopOfBars={true}
            />
            
          </View>
        ) : (
          <Text style={styles.emptyText}>Không có dữ liệu để hiển thị.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  bodyContainer: {
    padding: 16,
  },
  cardContainer: {
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#ddd',
    borderRadius: 4,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#111111',
  },
  filterText: {
    fontSize: 14,
    color: '#333',
  },
  filterTextActive: {
    color: '#fff',
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#ddd',
    borderRadius: 4,
  },
  tabButtonActive: {
    backgroundColor: '#111111',
  },
  tabText: {
    fontSize: 14,
    color: '#333',
  },
  tabTextActive: {
    color: '#fff',
  },
  chart: {
    marginVertical: 16,
    borderRadius: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#555',
    fontSize: 16,
    marginTop: 20,
  },
  loading: {
    marginTop: 50,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    justifyContent: 'space-between',
  },
  goBackButton: {
    padding: 10,
    borderRadius: 50,
    backgroundColor: '#efefef',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
});
