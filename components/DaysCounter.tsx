import { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FadeInView } from '@/components/animations';
import { Colors } from '@/constants/Colors';
import {
  RELATIONSHIP_START_DATE,
  ROMANTIC_QUOTES,
  COUNTER_COLORS,
} from '@/constants/relationship';
import { Ionicons } from '@expo/vector-icons';

interface DaysCounterProps {
  startDate?: string;
  showQuote?: boolean;
}

interface TimeData {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface QuoteData {
  text: string;
  author: number;
}

export default function DaysCounter({
  startDate = RELATIONSHIP_START_DATE,
  showQuote = true,
}: DaysCounterProps) {
  const [timeData, setTimeData] = useState<TimeData>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [quote, setQuote] = useState<QuoteData>({
    text: ROMANTIC_QUOTES[0],
    author: 1,
  });

  // Calculate time difference
  useEffect(() => {
    const start = new Date(startDate);

    const updateCounter = () => {
      const now = new Date();
      const diff = now.getTime() - start.getTime();

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeData({ days, hours, minutes, seconds });
    };

    updateCounter();
    const interval = setInterval(updateCounter, 1000);

    return () => clearInterval(interval);
  }, [startDate]);

  // Daily quote - updates once per day
  useEffect(() => {
    const getQuoteOfTheDay = async () => {
      const today = new Date().toDateString();

      try {
        const stored = await AsyncStorage.getItem('dailyQuote');

        if (stored) {
          const parsed = JSON.parse(stored);
          // If it's the same day, use stored quote
          if (parsed.date === today) {
            setQuote(parsed.quote);
            return;
          }
        }

        // New day or no stored quote - generate new one
        const randomIndex = Math.floor(Math.random() * ROMANTIC_QUOTES.length);
        const newQuote = {
          text: ROMANTIC_QUOTES[randomIndex],
          author: randomIndex + 1,
        };

        // Store for the day
        await AsyncStorage.setItem(
          'dailyQuote',
          JSON.stringify({
            date: today,
            quote: newQuote,
          })
        );

        setQuote(newQuote);
      } catch (error) {
        console.error('Error with daily quote:', error);
      }
    };

    getQuoteOfTheDay();
  }, []);

  const getColorForType = (type: keyof typeof COUNTER_COLORS) => {
    const colorKey = COUNTER_COLORS[type] as keyof typeof Colors;
    return Colors[colorKey] || Colors.primary;
  };

  return (
    <View style={styles.container}>
      {/* Counter */}
      <FadeInView>
        <View style={styles.counterCard}>
          <View style={styles.headerContainer}>
            <Ionicons
              name="heart"
              size={40}
              color={Colors.primary}
              style={styles.heartIcon}
            />
            <Text style={styles.title}>Juntos há...</Text>
          </View>

          <View style={styles.countersGrid}>
            <View style={styles.counterItem}>
              <Text style={[styles.counterValue, { color: getColorForType('days') }]}>
                {timeData.days}
              </Text>
              <Text style={styles.counterLabel}>DIAS</Text>
            </View>

            <View style={styles.counterItem}>
              <Text style={[styles.counterValue, { color: getColorForType('hours') }]}>
                {timeData.hours}
              </Text>
              <Text style={styles.counterLabel}>HORAS</Text>
            </View>

            <View style={styles.counterItem}>
              <Text style={[styles.counterValue, { color: getColorForType('minutes') }]}>
                {timeData.minutes}
              </Text>
              <Text style={styles.counterLabel}>MINUTOS</Text>
            </View>
          </View>

          <View style={styles.secondsContainer}>
            <Text style={styles.secondsText}>E cada segundo vale ouro... </Text>
            <Text style={[styles.secondsValue, { color: getColorForType('seconds') }]}>
              {timeData.seconds}
            </Text>
          </View>
        </View>
      </FadeInView>

      {/* Quote */}
      {showQuote && (
        <FadeInView delay={300}>
          <View style={styles.quoteCard}>
            <Ionicons
              name="sparkles"
              size={28}
              color={Colors.primary}
              style={styles.sparklesIcon}
            />
            <View style={styles.quoteContent}>
              <Text style={styles.quoteText}>"{quote.text}"</Text>
              <Text style={styles.quoteAuthor}>
                - Frase Genérica #{quote.author}
              </Text>
            </View>
          </View>
        </FadeInView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  counterCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    paddingTop: 32,
    paddingHorizontal: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  heartIcon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
  },
  countersGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  counterItem: {
    alignItems: 'center',
    flex: 1,
  },
  counterValue: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  counterLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: Colors.textSecondary,
  },
  secondsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 32,
    gap: 4,
  },
  secondsText: {
    fontSize: 18,
    fontStyle: 'italic',
    color: Colors.text,
  },
  secondsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
  quoteCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  sparklesIcon: {
    marginBottom: 16,
  },
  quoteContent: {
    alignItems: 'center',
    gap: 8,
  },
  quoteText: {
    fontSize: 18,
    lineHeight: 28,
    color: Colors.text,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  quoteAuthor: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
