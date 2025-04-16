import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, Switch } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useRoute } from '@react-navigation/native';
import ParamList from '../navigation/Data';
import { RouteProp } from '@react-navigation/native';
import supabase from '../database/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
};

type ShippingFeeRouteProp = RouteProp<ParamList, 'ShippingFee'>;

type Ship = {
    id: number;
    name: string;
    basicFee: number;
    weightLimit: number;
};

export default function ShippingFee() {
    const route = useRoute<ShippingFeeRouteProp>();
    const navigation = useNavigation();
    const { productId, weight, shippingMethod } = route.params;
    const [isLoading, setIsLoading] = useState(true);
    const [shippingData, setShippingData] = useState<Ship[]>([]); 
    const [editableWeight, setEditableWeight] = useState(weight.toString());
    const [isEditing, setIsEditing] = useState(false);
    const [selectedMethods, setSelectedMethods] = useState<number[]>([]);

    const fetchShippingData = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase.from('shippingmethod').select('*');
            
            if (error) {
                console.error('Error fetching shipping data:', error.message);
            } else {
                setShippingData(data);
                const initialSelected = Array.isArray(shippingMethod)
                ? shippingMethod.map((method: { id: number }) => method.id) 
                : JSON.parse(shippingMethod).map((method: { id: number }) => method.id);
                
                setSelectedMethods(initialSelected);
            }
        } catch (err) {
            console.error('Unexpected error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchShippingData();
    }, []);

    const handleToggle = (id: number) => {
        if (selectedMethods.includes(id)) {
            setSelectedMethods(selectedMethods.filter(methodId => methodId !== id));
        } else {
            setSelectedMethods([...selectedMethods, id]);
        }
    };

    const calculateShippingFee = (basicFee: number, weight: number) => {
        if (weight <= 500) return basicFee;
        const extraWeight = weight - 500;
        return basicFee + Math.ceil(extraWeight / 50) * 5000;
    };
    const handleSave = async () => {
        const shippingFees: { [key: string]: string } = {};
    
        shippingData.forEach(method => {
            if (selectedMethods.includes(method.id)) {
                const fee = calculateShippingFee(method.basicFee, parseInt(editableWeight));
                shippingFees[method.name] = formatPrice(fee).replace(/\n/g, ''); 
            }
        });
        const shippingMethodsArray = shippingData
        .filter(method => selectedMethods.includes(method.id)) 
        .map(method => ({ id: method.id }));
    
        try {
            const { error } = await supabase
                .from('Product')  
                .update([
                    {
                        Weight: parseInt(editableWeight),  
                        shipfee: shippingFees,  
                        shippingMethod: shippingMethodsArray,
                    }
                ])
                .eq('id', productId); 
    
            if (error) {
                console.error('Error saving data:', error.message);
            } else {
                console.log('Shipping data saved successfully!');
                navigation.goBack();  
            }
        } catch (err) {
            console.error('Unexpected error while saving:', err);
        }
    };

    return (
        <View style={styles.container}>
            {isLoading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#0000ff" />
                </View>
            ) : (
                <>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <Ionicons name="arrow-back" size={24} color="black" />
                        </TouchableOpacity>
                        <Text style={styles.title}>Chi phí vận chuyển</Text>
                    </View>
                    <View style={styles.weightSection}>
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Cân nặng <Text style={styles.requiredStar}>*</Text></Text>
                            {isEditing ? (
                                <TextInput
                                    style={styles.input}
                                    value={editableWeight}
                                    onChangeText={setEditableWeight}
                                    keyboardType="numeric"
                                    onBlur={() => setIsEditing(false)}
                                />
                            ) : (
                                <TouchableOpacity onPress={() => setIsEditing(true)}>
                                    <Text style={styles.cardText}>{editableWeight} g</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                    <View style={styles.content}>
                        {shippingData.map(method => (
                            <View key={method.id} style={styles.shippingMethodCard}>
                                <View style={styles.shippingMethodContent}>
                                    <Text style={styles.methodText}>{method.name} {`(<= ${method.weightLimit}g)`}</Text>
                                    <View style={styles.toggleContainer}>
                                        {parseInt(editableWeight) <= method.weightLimit && (
                                            <Text style={styles.shippingFee}>
                                                {formatPrice(calculateShippingFee(method.basicFee, parseInt(editableWeight)))}
                                            </Text>
                                        )}
                                        {parseInt(editableWeight) <= method.weightLimit && (
                                            <Switch
                                                value={selectedMethods.includes(method.id)}
                                                onValueChange={() => handleToggle(method.id)}
                                            />
                                        )}
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                    <View style={styles.saveButtonContainer}>
                        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                            <Text style={styles.saveButtonText}>Cập nhật</Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
    },
    weightSection: {
        padding: 15,
        backgroundColor: '#f5f5f5',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    card: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#fff',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    requiredStar: {
        color: 'red',
        fontSize: 18,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    cardText: {
        fontSize: 18,
        color: '#333',
    },
    input: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        fontSize: 18,
        width: '40%',
    },
    content: {
        padding: 15,
    },
    shippingMethodCard: {
        marginBottom: 15,
        backgroundColor: '#fff',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    shippingMethodContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
    },
    methodText: {
        fontSize: 16,
    },
    toggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    shippingFee: {
        marginRight: 10,
        fontSize: 16,
        fontWeight: 'bold',
    },
    saveButtonContainer: {
        padding: 20,
        alignItems: 'center',
    },
    saveButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 8,
        elevation: 3,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
