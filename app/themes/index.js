import { Dimensions } from 'react-native';

const { height, width } = Dimensions.get('window');

const palette = [
    {   // orange
        text: '#f97316', 
        bgColor: opacity => `rgba(251, 146, 60, ${opacity})`
    },
    {   // dark gray
        text: '#334155', 
        bgColor: opacity => `rgba(30, 41, 59, ${opacity})`,
    },
    {   // purple
        text: '#7c3aed', 
        bgColor: opacity => `rgba(167, 139, 250, ${opacity})`,
    },
    {   // green
        text: '#009950', 
        bgColor: opacity => `rgba(0, 179, 89, ${opacity})`,
    },
    {   // teal
        text: '#14b8a6',
        bgColor: opacity => `rgba(45, 212, 191, ${opacity})`
    },
    {   // red
        text: '#dc2626',
        bgColor: opacity => `rgba(248, 113, 113, ${opacity})`
    },
    {
        text: '#9961ee',
        bgColor: opacity => `rgba(153, 97, 238, ${opacity})`
    },
];

export const themeColors = {
    ...palette[4]
};

export const bgColor = {
    bgcolor: '#FFFFFF'
};

export const COLORS = {
    primary: 'rgba(0, 0, 0, 1)',
    white: '#FFFFFF',
    gray: '#ECF0F4',
};

export const cartColor = {
    bgColor: '#111111'
}

export const SIZES = {
    // Global SIZES
    base: 8,
    font: 14,
    radius: 30,
    padding: 8,
    padding2: 12,
    padding3: 16,

    // FONTS Sizes
    largeTitle: 50,
    h1: 30,
    h2: 22,
    h3: 20,
    h4: 18,
    body1: 30,
    body2: 20,
    body3: 16,
    body4: 14,

    // App Dimensions
    width,
    height,
};

export default {
    themeColors,
    bgColor,
    COLORS,
    SIZES,
    cartColor,
};