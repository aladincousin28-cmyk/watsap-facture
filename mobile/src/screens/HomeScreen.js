import React, { useCallback, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Animated, SafeAreaView, useWindowDimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { getStats, getCharts, getExpenseStats } from '../api';
import { showToast } from '../components/Toast';
import { getColors, getTheme } from '../theme';
import { t, getCurrentLang } from '../i18n';
import { s, fs } from '../responsive';
import LoadingCard from '../components/LoadingCard';

function useStyles() {
  const C = getColors();
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;
  return { C, isTablet };
}

function StatCard({ icon, label, value, color, bg }) {
  const { C } = useStyles();
  return (
    <View style={[ss.statCard, { borderLeftColor: color, borderLeftWidth: 3, backgroundColor: C.card, borderColor: C.cardBorder }]}>
      <View style={[ss.statIconWrap, { backgroundColor: bg || 'transparent' }]}>
        <Ionicons name={icon} size={s(20)} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[ss.statLabel, { color: C.subtext }]}>{label}</Text>
        <Text style={[ss.statValue, { color }]}>{value}</Text>
      </View>
    </View>
  );
}

function AnimatedCard({ icon, label, value, color, bg, delay }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <StatCard icon={icon} label={label} value={value} color={color} bg={bg} />
    </Animated.View>
  );
}

const MONTH_NAMES = ['','جانفي','فيفري','مارس','أفريل','ماي','جوان','جويلية','أوت','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const MONTH_NAMES_FR = ['','Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'];

function BarChart({ data, labels, color, height = 120, C, isSmall }) {
  const max = Math.max(...data, 1);
  const isAr = getCurrentLang() === 'ar';
  const monthNames = isAr ? MONTH_NAMES : MONTH_NAMES_FR;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: s(4), height: s(height), paddingTop: s(8) }}>
      {data.map((v, i) => (
        <View key={i} style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ color: C.subtext, fontSize: fs(8), marginBottom: 2 }}>{v.toFixed(0)}</Text>
          <View style={{ width: '60%', height: Math.max((v / max) * s(height - 24), 4), backgroundColor: color, borderRadius: s(3), minHeight: 4 }} />
          <Text style={{ color: C.muted, fontSize: fs(8), marginTop: 2 }}>{monthNames[parseInt(labels[i]?.split('-')[1])] || labels[i]}</Text>
        </View>
      ))}
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [expStats, setExpStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const { C, isTablet } = useStyles();
  const { width } = useWindowDimensions();

  const load = useCallback(async () => {
    try { setStats(await getStats()); } catch (e) { if (e.name === 'ApiError') showToast(e.message, 'error'); }
    try { setCharts(await getCharts()); } catch (_) {}
    try { setExpStats(await getExpenseStats()); } catch (_) {}
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true); await load(); setRefreshing(false);
  };

  const today = new Date().toLocaleDateString('fr-TN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const pct = stats?.total_amount > 0 ? Math.round((stats.collected / stats.total_amount) * 100) : 0;

  return (
    <SafeAreaView style={[ss.container, { backgroundColor: C.bg }]}>
      <ScrollView
        contentContainerStyle={[ss.scroll, { maxWidth: isTablet ? 600 : '100%', alignSelf: isTablet ? 'center' : 'stretch' }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.gold} />}
      >
        <View style={[ss.header, { paddingHorizontal: s(20), paddingTop: s(8), paddingBottom: s(8) }]}>
          <View>
            <Text style={[ss.greeting, { color: C.subtext, fontSize: fs(12) }]}>{today}</Text>
            <Text style={[ss.title, { color: C.white, fontSize: fs(26) }]}>{t('appName')}</Text>
          </View>
          <TouchableOpacity style={[ss.logoWrap, { backgroundColor: C.card, borderColor: C.cardBorder }]} onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="settings-outline" size={s(22)} color={C.gold} />
          </TouchableOpacity>
        </View>

        {!stats ? (
          <View style={[ss.statsGrid, { paddingHorizontal: s(16) }]}>
            {[1, 2, 3, 4].map(i => <LoadingCard key={i} height={s(76)} />)}
          </View>
        ) : (
          <>
            <View style={[ss.statsGrid, { paddingHorizontal: s(16) }]}>
              <AnimatedCard icon="document-text" label={t('total')} value={stats.total} color={C.gold} bg={C.cardBorder} delay={50} />
              <AnimatedCard icon="checkmark-circle" label={t('paid')} value={stats.paid} color={C.green} bg={C.greenBg} delay={100} />
              <AnimatedCard icon="time" label={t('pending')} value={stats.pending} color={C.red} bg={C.redBg} delay={150} />
              <AnimatedCard icon="repeat" label={t('recurring')} value={stats.recurring || 0} color={C.blue} bg={C.blueBg} delay={200} />
            </View>

            <View style={[ss.totalCard, { backgroundColor: C.card, borderColor: C.cardBorder, marginHorizontal: s(16), padding: s(18) }]}>
              <Text style={[ss.totalLabel, { color: C.subtext, fontSize: fs(11) }]}>{t('revenue').toUpperCase()}</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: s(4) }}>
                <View>
                  <Text style={[ss.totalSmall, { color: C.subtext, fontSize: fs(11) }]}>{t('totalInvoiced')}</Text>
                  <Text style={[ss.totalValue, { color: C.gold, fontSize: fs(22) }]}>{stats.total_amount?.toFixed(2)} {t('tnDinar')}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[ss.totalSmall, { color: C.subtext, fontSize: fs(11) }]}>{t('collected')}</Text>
                  <Text style={[ss.totalValue, { color: C.green, fontSize: fs(22) }]}>{stats.collected?.toFixed(2)} {t('tnDinar')}</Text>
                </View>
              </View>
              <View style={[ss.progressWrap, { marginTop: s(12) }]}>
                <View style={[ss.progressBar, { backgroundColor: C.cardBorder }]}>
                  <View style={[ss.progressFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: C.green }]} />
                </View>
                <Text style={[ss.progressPct, { color: C.green, fontSize: fs(12) }]}>{pct}%</Text>
              </View>
            </View>
          </>
        )}

        {charts && (
          <View style={[ss.chartCard, { backgroundColor: C.card, borderColor: C.cardBorder, marginHorizontal: s(16), padding: s(16), marginTop: s(14) }]}>
            <Text style={{ color: C.subtext, fontSize: fs(11), fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: s(8) }}>{t('charts')}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: s(4) }}>
              <Text style={{ color: C.gold, fontSize: fs(11), fontWeight: '600' }}>{t('revenue')}</Text>
              <Text style={{ color: C.red, fontSize: fs(11), fontWeight: '600' }}>{t('expenses')}</Text>
            </View>
            <BarChart data={charts.revenue} labels={charts.months} color={C.gold} height={100} C={C} isSmall={false} />
            <BarChart data={charts.expenses} labels={charts.months} color={C.red} height={60} C={C} isSmall={false} />
          </View>
        )}

        {expStats && (
          <View style={[ss.chartCard, { backgroundColor: C.card, borderColor: C.cardBorder, marginHorizontal: s(16), padding: s(16), marginTop: s(8) }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ color: C.subtext, fontSize: fs(10), textTransform: 'uppercase', fontWeight: '600' }}>{t('totalExpenses')}</Text>
                <Text style={{ color: C.red, fontSize: fs(20), fontWeight: '800' }}>{expStats.total_expenses.toFixed(2)} {t('tnDinar')}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: C.subtext, fontSize: fs(10), textTransform: 'uppercase', fontWeight: '600' }}>{t('netProfit')}</Text>
                <Text style={{ color: expStats.net_profit >= 0 ? C.green : C.red, fontSize: fs(20), fontWeight: '800' }}>
                  {expStats.net_profit.toFixed(2)} {t('tnDinar')}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={[ss.actions, { paddingHorizontal: s(16), gap: s(10), marginTop: s(16) }]}>
          <TouchableOpacity style={[ss.primaryBtn, { backgroundColor: C.gold, padding: s(16), borderRadius: s(14) }]} onPress={() => navigation.navigate('Create')}>
            <Ionicons name="add" size={s(22)} color={C.bg} />
            <Text style={[ss.primaryBtnText, { color: C.bg, fontSize: fs(15) }]}>{t('newInvoiceBtn')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[ss.secondaryBtn, { backgroundColor: C.card, borderColor: C.cardBorder, padding: s(16), borderRadius: s(14) }]} onPress={() => navigation.navigate('Clients')}>
            <Ionicons name="people" size={s(20)} color={C.gold} />
            <Text style={[ss.secondaryBtnText, { color: C.gold, fontSize: fs(13) }]}>{t('clients')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[ss.secondaryBtn, { backgroundColor: C.card, borderColor: C.cardBorder, padding: s(16), borderRadius: s(14) }]} onPress={() => navigation.navigate('Expenses')}>
            <Ionicons name="cash-outline" size={s(20)} color={C.red} />
            <Text style={[ss.secondaryBtnText, { color: C.red, fontSize: fs(13) }]}>{t('expenses')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const ss = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontWeight: '500', textTransform: 'capitalize' },
  title: { fontWeight: '800', marginTop: 2 },
  logoWrap: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  statsGrid: { marginTop: 16, gap: 8 },
  statCard: { borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1 },
  statIconWrap: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  statLabel: { fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 20, fontWeight: '700', marginTop: 2 },
  totalCard: { borderRadius: 16, marginTop: 12, borderWidth: 1 },
  totalLabel: { fontWeight: '600', letterSpacing: 1 },
  totalSmall: { marginTop: 4 },
  totalValue: { fontWeight: '800', marginTop: 1 },
  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressBar: { flex: 1, height: 6, borderRadius: 3 },
  progressFill: { height: 6, borderRadius: 3 },
  progressPct: { fontWeight: '700' },
  chartCard: { borderRadius: 16, borderWidth: 1 },
  actions: { flexDirection: 'row' },
  primaryBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryBtnText: { fontWeight: '700' },
  secondaryBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1 },
  secondaryBtnText: { fontWeight: '600' },
});
