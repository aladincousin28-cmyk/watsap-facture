import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView, useWindowDimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { createInvoice } from '../api';
import { showToast } from '../components/Toast';
import { getColors } from '../theme';
import { t } from '../i18n';
import { s, fs } from '../responsive';

const RECURRING = [
  { labelKey: 'oneTime', value: '' },
  { label: '7j', value: '7' },
  { label: '15j', value: '15' },
  { label: '30j', value: '30' },
  { label: '90j', value: '90' },
  { label: '365j', value: '365' },
];

function useStyles() {
  const C = getColors();
  const { width } = useWindowDimensions();
  return { C, isTablet: width >= 600, isSmall: width < 360 };
}

export default function CreateInvoiceScreen({ navigation, route }) {
  const { C, isTablet, isSmall } = useStyles();
  const clientName = route?.params?.clientName || '';
  const clientPhone = route?.params?.clientPhone || '';
  const [form, setForm] = useState({ name: clientName, phone: clientPhone, service: '', amount: '', recurring: '' });
  const [loading, setLoading] = useState(false);

  const update = (key) => (val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleCreate = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!form.name.trim() || !form.service.trim() || !form.amount) {
      showToast(`${t('clientName')}, ${t('service')} ${t('amount')} ${t('optional')}`, 'error');
      return;
    }
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      showToast(t('amount'), 'error');
      return;
    }
    setLoading(true);
    try {
      const r = await createInvoice({
        client_name: form.name.trim(),
        client_phone: form.phone.trim(),
        service: form.service.trim(),
        amount,
        recurring_days: form.recurring ? parseInt(form.recurring) : null,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(`#${r.invoice_id}`, 'success');
      navigation.navigate('Invoices');
    } catch (e) {
      showToast(e.name === 'ApiError' ? e.message : 'Erreur réseau', 'error');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={[ss.container, { backgroundColor: C.bg }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: s(16), paddingBottom: s(40) }} keyboardShouldPersistTaps="handled">
          <View style={[ss.form, { backgroundColor: C.card, borderColor: C.cardBorder, padding: s(isSmall ? 14 : 20), borderRadius: s(16) }]}>
            <View style={[ss.field, { marginBottom: s(16) }]}>
              <Text style={[ss.label, { color: C.subtext, fontSize: fs(11) }]}>{t('clientName')} <Text style={{ color: C.red }}>*</Text></Text>
              <TextInput style={[ss.input, { backgroundColor: C.surface, color: C.white, borderColor: C.cardBorder, padding: s(14), borderRadius: s(10), fontSize: fs(14) }]}
                value={form.name} onChangeText={update('name')} placeholder="Ahmed Ben Salem" placeholderTextColor={C.muted} />
            </View>
            <View style={[ss.field, { marginBottom: s(16) }]}>
              <Text style={[ss.label, { color: C.subtext, fontSize: fs(11) }]}>{t('clientPhone')}</Text>
              <TextInput style={[ss.input, { backgroundColor: C.surface, color: C.white, borderColor: C.cardBorder, padding: s(14), borderRadius: s(10), fontSize: fs(14) }]}
                value={form.phone} onChangeText={update('phone')} placeholder="216XXXXXXXX" keyboardType="phone-pad" placeholderTextColor={C.muted} />
            </View>
            <View style={[ss.field, { marginBottom: s(16) }]}>
              <Text style={[ss.label, { color: C.subtext, fontSize: fs(11) }]}>{t('service')} <Text style={{ color: C.red }}>*</Text></Text>
              <TextInput style={[ss.input, { backgroundColor: C.surface, color: C.white, borderColor: C.cardBorder, padding: s(14), borderRadius: s(10), fontSize: fs(14) }]}
                value={form.service} onChangeText={update('service')} placeholder={t('service')} placeholderTextColor={C.muted} />
            </View>
            <View style={[ss.field, { marginBottom: s(16) }]}>
              <Text style={[ss.label, { color: C.subtext, fontSize: fs(11) }]}>{t('amount')} (TND) <Text style={{ color: C.red }}>*</Text></Text>
              <TextInput style={[ss.input, { backgroundColor: C.surface, color: C.white, borderColor: C.cardBorder, padding: s(14), borderRadius: s(10), fontSize: fs(14) }]}
                value={form.amount} onChangeText={update('amount')} placeholder="150" keyboardType="decimal-pad" placeholderTextColor={C.muted} />
            </View>
            <View style={[ss.field, { marginBottom: s(16) }]}>
              <Text style={[ss.label, { color: C.subtext, fontSize: fs(11) }]}>{t('recurring')}</Text>
              <View style={[ss.chips, { gap: s(6), marginTop: s(2) }]}>
                {RECURRING.map(r => (
                  <TouchableOpacity key={r.value} style={[ss.chip, form.recurring === r.value && { backgroundColor: C.gold, borderColor: C.gold },
                    { backgroundColor: C.surface, borderColor: C.cardBorder, paddingVertical: s(8), paddingHorizontal: s(14), borderRadius: s(20) }]}
                    onPress={() => update('recurring')(r.value)}>
                    <Text style={[ss.chipText, form.recurring === r.value && { color: C.bg, fontWeight: '700' },
                      { color: form.recurring === r.value ? C.bg : C.subtext, fontSize: fs(12) }]}>
                      {r.labelKey ? t(r.labelKey) : `${t('every')} ${r.label}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
          <TouchableOpacity style={[ss.submitBtn, loading && { opacity: 0.6 },
            { backgroundColor: C.gold, padding: s(16), borderRadius: s(14), marginTop: s(20) }]}
            onPress={handleCreate} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={C.bg} />
            ) : (
              <>
                <Ionicons name="add-circle" size={s(22)} color={C.bg} />
                <Text style={[ss.submitText, { color: C.bg, fontSize: fs(15) }]}>{t('create')}</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const ss = StyleSheet.create({
  container: { flex: 1 },
  form: { borderWidth: 1 },
  field: {},
  label: { fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { borderWidth: 1 },
  chipText: { fontWeight: '500' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitText: { fontWeight: '700' },
});
