import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, Linking, SafeAreaView, useWindowDimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { getInvoices, markPaid, sendReminder, getInvoicePdfUrl } from '../api';
import { showToast } from '../components/Toast';
import { getColors } from '../theme';
import { t } from '../i18n';
import { s, fs } from '../responsive';
import LoadingCard from '../components/LoadingCard';

function useStyles() {
  const C = getColors();
  const { width } = useWindowDimensions();
  return { C, isTablet: width >= 600, isSmall: width < 360 };
}

const TABS = [
  { key: '', labelKey: 'allTime', icon: 'list' },
  { key: 'pending', labelKey: 'pending', icon: 'time' },
  { key: 'paid', labelKey: 'paid', icon: 'checkmark-circle' },
  { key: 'recurring', labelKey: 'recurring', icon: 'repeat' },
];

function StatusBadge({ status, C }) {
  const paid = status === 'paid';
  return (
    <View style={[ss.badge, { backgroundColor: paid ? C.greenBg : '#2a1a0a', paddingVertical: s(4), paddingHorizontal: s(10) }]}>
      <Ionicons name={paid ? 'checkmark-circle' : 'time'} size={fs(12)} color={paid ? C.green : '#F0A030'} />
      <Text style={[ss.badgeText, { color: paid ? C.green : '#F0A030', fontSize: fs(11) }]}>{paid ? t('status_paid') : t('status_pending')}</Text>
    </View>
  );
}

export default function InvoicesScreen() {
  const [invoices, setInvoices] = useState([]);
  const [tab, setTab] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { C, isTablet, isSmall } = useStyles();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setInvoices(await getInvoices({
        status: tab !== 'recurring' ? tab : undefined,
        recurring: tab === 'recurring' || undefined,
      }));
    } catch (e) { if (e.name === 'ApiError') showToast(e.message, 'error'); }
    setLoading(false);
  }, [tab]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setRefreshing(true); await load(); setRefreshing(false); };
  const handlePay = async (id) => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); try { await markPaid(id); showToast(t('status_paid'), 'success'); load(); } catch (e) { showToast(e.name === 'ApiError' ? e.message : 'Erreur réseau', 'error'); } };
  const handleRemind = async (id) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); try { await sendReminder(id); showToast('Rappel WhatsApp envoyé', 'success'); } catch (e) { showToast(e.name === 'ApiError' ? e.message : 'Erreur réseau', 'error'); } };
  const handleShare = (inv) => { Linking.openURL(`https://wa.me/${inv.client_phone}?text=${encodeURIComponent(`*فاتورة* #${inv.id}\n\n${t('clientName')}: ${inv.client_name}\n${t('service')}: ${inv.service}\n${t('amount')}: ${inv.amount.toFixed(2)} ${t('tnDinar')}\n${t('invoiceStatus')}: ${inv.status === 'paid' ? '✅' : '⏳'}\n`)}`); };

  const freqLabel = (d) => ({ 7: '7j', 15: '15j', 30: '30j', 90: '90j', 365: '365j' }[d] || `${d}j`);

  const renderItem = ({ item }) => (
    <View style={[ss.invCard, { backgroundColor: C.card, borderColor: C.cardBorder, padding: s(16), marginBottom: s(12), borderRadius: s(16) }]}>
      <View style={ss.invTop}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(8) }}>
          <View style={[ss.avatar, { backgroundColor: item.status === 'paid' ? C.greenBg : '#2a1a0a', width: s(40), height: s(40), borderRadius: s(20) }]}>
            <Text style={[ss.avatarText, { color: item.status === 'paid' ? C.green : C.gold, fontSize: fs(isSmall ? 14 : 16) }]}>
              {item.client_name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[ss.invName, { color: C.white, fontSize: fs(isSmall ? 14 : 15) }]} numberOfLines={1}>{item.client_name}</Text>
            <Text style={[ss.invService, { color: C.subtext, fontSize: fs(12) }]} numberOfLines={1}>{item.service}</Text>
          </View>
        </View>
        <StatusBadge status={item.status} C={C} />
      </View>

      <View style={[ss.invBody, { borderTopColor: C.cardBorder, paddingTop: s(12), marginTop: s(12) }]}>
        <Text style={[ss.invAmount, { color: C.gold, fontSize: fs(isSmall ? 20 : 22) }]}>{item.amount.toFixed(2)} <Text style={[ss.invCurrency, { color: C.subtext, fontSize: fs(13) }]}>{t('tnDinar')}</Text></Text>
        <Text style={[ss.invDate, { color: C.subtext, fontSize: fs(12) }]}>{new Date(item.created_at).toLocaleDateString('fr-TN')}</Text>
      </View>

      <View style={[ss.invMeta, { gap: s(12) }]}>
        {item.client_phone ? <Text style={[ss.metaItem, { color: C.subtext, fontSize: fs(11) }]}>{item.client_phone}</Text> : null}
        {item.recurring_days ? <Text style={[ss.metaItem, { color: C.blue, fontSize: fs(11) }]}>{freqLabel(item.recurring_days)}</Text> : null}
        <Text style={[ss.metaItem, { color: C.subtext, fontSize: fs(11) }]}>#{item.id}</Text>
      </View>

      <View style={[ss.actions, { gap: s(8), paddingTop: s(12), marginTop: s(12), borderTopColor: C.cardBorder }]}>
        {isSmall ? null : <TouchableOpacity style={[ss.actionBtn, { borderColor: C.cardBorder, paddingVertical: s(6), paddingHorizontal: s(10) }]} onPress={() => Linking.openURL(getInvoicePdfUrl(item.id))}>
          <Ionicons name="document-text-outline" size={fs(16)} color={C.gold} />
          <Text style={[ss.actionText, { color: C.gold, fontSize: fs(11) }]}>PDF</Text>
        </TouchableOpacity>}
        {item.status === 'pending' && <>
          <TouchableOpacity style={[ss.actionBtn, { backgroundColor: C.greenBg, borderColor: '#22C55E40', paddingVertical: s(6), paddingHorizontal: s(10) }]} onPress={() => handlePay(item.id)}>
            <Ionicons name="checkmark" size={fs(16)} color={C.green} />
            <Text style={[ss.actionText, { color: C.green, fontSize: fs(11) }]}>{t('markPaid')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[ss.actionBtn, { backgroundColor: C.blueBg, borderColor: '#3B82F640', paddingVertical: s(6), paddingHorizontal: s(10) }]} onPress={() => handleRemind(item.id)}>
            <Ionicons name="notifications-outline" size={fs(16)} color={C.blue} />
            <Text style={[ss.actionText, { color: C.blue, fontSize: fs(11) }]}>{t('sendReminder')}</Text>
          </TouchableOpacity>
        </>}
        <TouchableOpacity style={[ss.actionBtn, { borderColor: C.cardBorder, paddingVertical: s(6), paddingHorizontal: s(10) }]} onPress={() => handleShare(item)}>
          <Ionicons name="share-outline" size={fs(16)} color={C.subtext} />
          <Text style={[ss.actionText, { color: C.subtext, fontSize: fs(11) }]}>{t('share')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[ss.container, { backgroundColor: C.bg }]}>
      <View style={[ss.tabs, { paddingHorizontal: s(16), gap: s(6) }]}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} style={[ss.tab, tab === t.key && { backgroundColor: C.gold, borderColor: C.gold }, { backgroundColor: tab === t.key ? C.gold : C.card, borderColor: tab === t.key ? C.gold : C.cardBorder, paddingVertical: s(8), paddingHorizontal: s(12) }]} onPress={() => setTab(t.key)}>
            <Ionicons name={t.icon} size={fs(14)} color={tab === t.key ? C.bg : C.subtext} />
            <Text style={[ss.tabText, { color: tab === t.key ? C.bg : C.subtext, fontSize: fs(12) }]}>{t(t.labelKey)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && !refreshing ? (
        <View style={{ padding: s(16) }}>
          {[1, 2, 3].map(i => <LoadingCard key={i} height={s(200)} />)}
        </View>
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={i => String(i.id)}
          renderItem={renderItem}
          contentContainerStyle={[ss.listContent, { paddingHorizontal: s(16), paddingBottom: s(24), maxWidth: isTablet ? 600 : '100%', alignSelf: isTablet ? 'center' : 'stretch' }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.gold} />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: s(60) }}>
              <Ionicons name="document-text-outline" size={s(48)} color={C.muted} />
              <Text style={[ss.emptyTitle, { color: C.subtext, fontSize: fs(17) }]}>{t('noInvoices')}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const ss = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingBottom: 24 },
  tabs: { flexDirection: 'row', paddingTop: 12 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 10, borderWidth: 1 },
  tabText: { fontWeight: '600' },
  invCard: { borderWidth: 1 },
  invTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  avatar: { justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontWeight: '700' },
  invName: { fontWeight: '600' },
  invService: { marginTop: 1 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20 },
  badgeText: { fontWeight: '600' },
  invBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1 },
  invAmount: { fontWeight: '800' },
  invCurrency: { fontWeight: '500' },
  invDate: { fontWeight: '500' },
  invMeta: { flexDirection: 'row', marginTop: 8, flexWrap: 'wrap' },
  metaItem: { fontWeight: '500' },
  actions: { flexDirection: 'row', borderTopWidth: 1, flexWrap: 'wrap' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, borderWidth: 1 },
  actionText: { fontWeight: '600' },
  emptyTitle: { fontWeight: '600', marginTop: 12 },
});
