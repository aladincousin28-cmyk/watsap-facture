import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, SafeAreaView, Alert, useWindowDimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { getInvoices, createInvoice, getBaseUrl, setBaseUrl } from '../api';
import { showToast } from '../components/Toast';
import { getColors } from '../theme';
import { t } from '../i18n';
import { s, fs } from '../responsive';

function useStyles() {
  const C = getColors();
  const { width } = useWindowDimensions();
  return { C, isTablet: width >= 600 };
}

export default function ClientsScreen({ navigation }) {
  const { C, isTablet } = useStyles();
  const [invoices, setInvoices] = useState([]);

  const load = useCallback(async () => {
    try { setInvoices(await getInvoices()); }
    catch (e) { if (e.name === 'ApiError') showToast(e.message, 'error'); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const clientsMap = {};
  invoices.forEach(inv => {
    const key = inv.client_phone || inv.client_name;
    if (!key) return;
    if (!clientsMap[key]) clientsMap[key] = { name: inv.client_name, phone: inv.client_phone, count: 0, total: 0 };
    clientsMap[key].count++;
    clientsMap[key].total += inv.amount;
  });
  const clients = Object.values(clientsMap).sort((a, b) => b.total - a.total);

  return (
    <SafeAreaView style={[ss.container, { backgroundColor: C.bg }]}>
      <FlatList
        data={clients}
        contentContainerStyle={[ss.list, { maxWidth: isTablet ? 600 : '100%', alignSelf: isTablet ? 'center' : 'stretch' }]}
        keyExtractor={(_, i) => String(i)}
        ListHeaderComponent={<Text style={[ss.sectionTitle, { color: C.text, fontSize: fs(17), paddingHorizontal: s(16), paddingTop: s(8), paddingBottom: s(4) }]}>{t('clients')} ({clients.length})</Text>}
        ListEmptyComponent={<Text style={[ss.empty, { color: C.subtext, fontSize: fs(14), paddingTop: s(40) }]}>{t('noInvoices')}</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={[ss.card, { backgroundColor: C.card, borderColor: C.cardBorder, marginHorizontal: s(16), padding: s(14) }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate('Create', { clientName: item.name, clientPhone: item.phone });
            }}
          >
            <View style={[ss.avatar, { backgroundColor: C.surface }]}>
              <Text style={[ss.avatarText, { color: C.gold, fontSize: fs(18) }]}>{item.name?.charAt(0)?.toUpperCase() || '?'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[ss.clientName, { color: C.white, fontSize: fs(15) }]}>{item.name || t('allClient')}</Text>
              {item.phone ? <Text style={[ss.clientPhone, { color: C.subtext, fontSize: fs(12) }]}>{item.phone}</Text> : null}
              <View style={[ss.meta, { gap: s(12) }]}>
                <Text style={[ss.metaText, { color: C.subtext, fontSize: fs(11) }]}>{item.count} facture{item.count > 1 ? 's' : ''}</Text>
                <Text style={[ss.metaAmount, { color: C.gold, fontSize: fs(13) }]}>{item.total.toFixed(2)} {t('tnDinar')}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={s(18)} color={C.muted} />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const ss = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingBottom: 24 },
  sectionTitle: { fontWeight: '700' },
  empty: { textAlign: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, marginBottom: 8, gap: 12, borderWidth: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontWeight: '700' },
  clientName: { fontWeight: '600' },
  clientPhone: { marginTop: 1 },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  metaText: { fontWeight: '500' },
  metaAmount: { fontWeight: '700' },
});
