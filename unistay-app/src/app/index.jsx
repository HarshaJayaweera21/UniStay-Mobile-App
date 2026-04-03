import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Fonts, Spacing, Radius } from '@/constants/theme';
import { Colors } from '@/constants/colors';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  // ── Animations ──
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const brandTranslateY = useRef(new Animated.Value(20)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroTranslateY = useRef(new Animated.Value(30)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleTranslateY = useRef(new Animated.Value(20)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;
  const ctaTranslateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.stagger(200, [
      Animated.parallel([
        Animated.timing(brandOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(brandTranslateY, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(heroOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(heroTranslateY, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(subtitleTranslateY, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(ctaOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(ctaTranslateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* ── Mesh Gradient Background ── */}
      <LinearGradient
        colors={['#00174b', '#003ea8', '#004ac6', '#1e3a8a', '#00174b']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* ── Decorative Blur Orbs ── */}
      <View style={styles.orbBottomLeft} />
      <View style={styles.orbTopRight} />

      {/* ── Hero Content ── */}
      <View style={styles.content}>
        {/* Brand Identity */}
        <Animated.View
          style={[
            styles.brandContainer,
            {
              opacity: brandOpacity,
              transform: [{ translateY: brandTranslateY }],
            },
          ]}
        >
          <Text style={styles.brandText}>UniStay</Text>
        </Animated.View>

        {/* Main Headline */}
        <Animated.View
          style={[
            styles.heroContainer,
            {
              opacity: heroOpacity,
              transform: [{ translateY: heroTranslateY }],
            },
          ]}
        >
          <Text style={styles.heroText}>Welcome to{'\n'}UniStay</Text>
        </Animated.View>

        {/* Subtitle */}
        <Animated.View
          style={{
            opacity: subtitleOpacity,
            transform: [{ translateY: subtitleTranslateY }],
          }}
        >
          <Text style={styles.subtitleText}>
            Your smart solution for managing student accommodation. Curated
            living spaces designed for the modern academic journey.
          </Text>
        </Animated.View>

        {/* CTA Section */}
        <Animated.View
          style={[
            styles.ctaContainer,
            {
              opacity: ctaOpacity,
              transform: [{ translateY: ctaTranslateY }],
            },
          ]}
        >
          {/* Create Account Button */}
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed,
            ]}
            onPress={() => {
              router.push('/register');
            }}
          >
            <Text style={styles.primaryButtonText}>Create Account</Text>
          </Pressable>

          {/* Login Link */}
          <View style={styles.loginRow}>
            <Text style={styles.loginHint}>Already have an account? </Text>
            <Pressable
              onPress={() => {
                router.push('/login');
              }}
              hitSlop={12}
            >
              <Text style={styles.loginLink}>Log In</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

// ── Styles ──
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.welcomeGradientStart,
  },

  // ── Decorative Orbs ──
  orbBottomLeft: {
    position: 'absolute',
    bottom: -96,
    left: -96,
    width: 384,
    height: 384,
    borderRadius: 192,
    backgroundColor: '#2563eb',
    opacity: 0.2,
  },
  orbTopRight: {
    position: 'absolute',
    top: -96,
    right: -96,
    width: 384,
    height: 384,
    borderRadius: 192,
    backgroundColor: '#60a5fa',
    opacity: 0.1,
  },

  // ── Content ──
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
  },

  // ── Brand ──
  brandContainer: {
    marginBottom: Spacing.six * 0.75,
  },
  brandText: {
    fontFamily: Fonts.headline,
    fontSize: 28,
    color: '#93c5fd',
    letterSpacing: -0.5,
    textAlign: 'center',
  },

  // ── Hero ──
  heroContainer: {
    marginBottom: Spacing.five,
  },
  heroText: {
    fontFamily: Fonts.headlineExtraBold,
    fontSize: 52,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 58,
    letterSpacing: -2,
  },

  // ── Subtitle ──
  subtitleText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 17,
    color: 'rgba(191, 219, 254, 0.75)',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: Spacing.two,
    marginBottom: Spacing.six * 0.65,
  },

  // ── CTAs ──
  ctaContainer: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing.four,
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 18,
    paddingHorizontal: Spacing.five,
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    // Subtle shadow
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  primaryButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  primaryButtonText: {
    fontFamily: Fonts.headline,
    fontSize: 18,
    color: Colors.onPrimary,
    letterSpacing: -0.3,
  },

  // ── Login Link ──
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginHint: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 15,
    color: 'rgba(191, 219, 254, 0.6)',
  },
  loginLink: {
    fontFamily: Fonts.headline,
    fontSize: 15,
    color: '#ffffff',
    textDecorationLine: 'underline',
    textDecorationColor: 'rgba(255, 255, 255, 0.4)',
  },
});
