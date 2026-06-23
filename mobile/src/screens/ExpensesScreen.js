import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, RefreshControl, SafeAreaView, Alert, useWindowDimensions, ScrollView, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { getExpenses, createExpense, deleteExpense, getExpenseStats } from '../api';
import { showToast } from '../components/Toast';
import { getColors } from '../theme';
import { t } from '../i18n';
import { s, fs } from '../responsive';

const CATEGORIES = ['Materiel', 'Transport', 'Marketing', 'Salaire', 'Fournitures', 'Autre'];
const CAT_ICONS = { Materiel: 'hardware-chip', Transport: 'car', Marketing: 'megaphone', Salaire: 'cash', Fournitures: 'cube', Autre: 'ellipsis-horizontal' };

function useStyles() {
  const C = getColors();
  const { width } = useWindowDimensions();
  return { C, isTablet: width >= 600, isSmall: width < 360 };
}

function CategoryPie({ stats, C }) {
  if (!stats?.by_category) return null;
  const total = Object.values(stats.by_category).reduce((a, b) => a + b, 0);
  if (total === 0) return null;
  const entries = Object.entries(stats.by_category).sort((a, b) => b[1] - a[1]);
  const colors = [C.gold, C.blue, C.green, '#F0A030', '#A855F7', C.red];
  return (
    <View style={{ marginTop: s(12) }}>
      {entries.map(([cat, amt], i) => (
        <View key={cat} style={{ flexDirection: 'row', alignItems: 'center', gap: s(8), marginBottom: s(6) }}>
          <View style={{ width: s(10), height: s(10), borderRadius: s(5), backgroundColor: colors[i % colors.length] }} />
          <Text style={{ flex: 1, color: C.subtext, fontSize: fs(12) }}>{t('categories')[cat] || cat}</Text>
          <Text style={{ color: C.white, fontSize: fs(12), fontWeight: '600' }}>{amt.toFixed(2)} {t('tnDinar')}</Text>
          <Text style={{ color: C.muted, fontSize: fs(11) }}>({Math.round(amt / total * 100)}%)</Text>
        </View>
      ))}
    </View>
  );
}

function AddExpenseModal({ visible, onClose, C, isSmall }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Autre');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!description.trim() || !amount) { showToast('Description et montant obligatoires', 'error'); return; }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { showToast('Montant invalide', 'error'); return; }
    setLoading(true);
    try {
      await createExpense({ description: description.trim(), amount: amt, category, expense_date: date });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Dépense ajoutée', 'success');
      onClose(true);
    } catch (e) { showToast(e.name === 'ApiError' ? e.message : 'Erreur réseau', 'error'); }
    setLoading(false);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => onClose(false)}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: C.card, borderTopLeftRadius: s(20), borderTopRightRadius: s(20), padding: s(20), maxHeight: '85%' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: s(16) }}>
            <Text style={{ color: C.white, fontSize: fs(17), fontWeight: '700' }}>{t('newExpense')}</Text>
            <TouchableOpacity onPress={() => onClose(false)}><Ionicons name="close" size={s(24)} color={C.subtext} /></TouchableOpacity>
          </View>
          <ScrollView>
            <Text style={{ color: C.subtext, fontSize: fs(11), fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' }}>{t('expenseDescription')}</Text>
            <TextInput style={{ backgroundColor: C.surface, color: C.white, borderColor: C.cardBorder, borderWidth: 1, borderRadius: s(10), padding: s(12), fontSize: fs(14), marginBottom: s(12) }}
              value={description} onChangeText={setDescription} placeholder="..." placeholderTextColor={C.muted} />

            <Text style={{ color: C.subtext, fontSize: fs(11), fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' }}>{t('amount')} (TND)</Text>
            <TextInput style={{ backgroundColor: C.surface, color: C.white, borderColor: C.cardBorder, borderWidth: 1, borderRadius: s(10), padding: s(12), fontSize: fs(14), marginBottom: s(12) }}
              value={amount} onChangeText={setAmount} placeholder="0" keyboardType="decimal-pad" placeholderTextColor={C.muted} />

            <Text style={{ color: C.subtext, fontSize: fs(11), fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' }}>{t('expenseCategory')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s(6), marginBottom: s(12) }}>
              {CATEGORIES.map(c => (
                <TouchableOpacity key={c} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: s(8), paddingHorizontal: s(12), borderRadius: s(20),
                  backgroundColor: category === c ? C.gold : C.surface, borderWidth: 1, borderColor: category === c ? C.gold : C.cardBorder }}
                  onPress={() => setCategory(c)}>
                  <Ionicons name={CAT_ICONS[c]} size={fs(14)} color={category === c ? C.bg : C.subtext} />
                  <Text style={{ color: category === c ? C.bg : C.subtext, fontSize: fs(12), fontWeight: category === c ? '700' : '500' }}>{t('categories')[c] || c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ color: C.subtext, fontSize: fs(11), fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' }}>{t('expenseDate')}</Text>
            <TextInput style={{ backgroundColor: C.surface, color: C.white, borderColor: C.cardBorder, borderWidth: 1, borderRadius: s(10), padding: s(12), fontSize: fs(14), marginBottom: s(16) }}
              value={date} onChangeText={setDate} placeholder="2026-01-15" placeholderTextColor={C.muted} />

            <TouchableOpacity style={{ backgroundColor: C.gold, padding: s(16), borderRadius: s(14), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.6 : 1 }}
              onPress={handleAdd} disabled={loading}>
              <Ionicons name="add-circle" size={s(20)} color={C.bg} />
              <Text style={{ color: C.bg, fontSize: fs(15), fontWeight: '700' }}>{t('create')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function ExpensesScreen() {
  const { C, isTablet, isSmall } = useStyles();
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterCat, setFilterCat] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [exps, st] = await Promise.all([
        getExpenses(filterCat ? { category: filterCat } : {}),
        getExpenseStats(),
      ]);
      setExpenses(exps);
      setStats(st);
    } catch (e) { if (e.name === 'ApiError') showToast(e.message, 'error'); }
    setLoading(false);
  }, [filterCat]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setRefreshing(true); await load(); setRefreshing(false); };

  const handleDelete = (id) => {
    Alert.alert(t('confirmDelete'), '', [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: async () => {
        try { await deleteExpense(id); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); load(); }
        catch (e) { showToast('Erreur', 'error'); }
      }},
    ]);
  };

  return (
    <SafeAreaView style={[ss.container, { backgroundColor: C.bg }]}>
      <View style={{ flexDirection: 'row', gap: s(6), paddingHorizontal: s(16), paddingTop: s(8), flexWrap: 'wrap' }}>
        <TouchableOpacity style={{ paddingVertical: s(6), paddingHorizontal: s(12), borderRadius: s(20), backgroundColor: !filterCat ? C.gold : C.card, borderWidth: 1, borderColor: !filterCat ? C.gold : C.cardBorder }}
          onPress={() => setFilterCat('')}>
          <Text style={{ color: !filterCat ? C.bg : C.subtext, fontSize: fs(12), fontWeight: '600' }}>{t('allTime')}</Text>
        </TouchableOpacity>
        {CATEGORIES.map(c => (
          <TouchableOpacity key={c} style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: s(6), paddingHorizontal: s(10), borderRadius: s(20),
            backgroundColor: filterCat === c ? C.gold : C.card, borderWidth: 1, borderColor: filterCat === c ? C.gold : C.cardBorder }}
            onPress={() => setFilterCat(c)}>
            <Ionicons name={CAT_ICONS[c]} size={fs(11)} color={filterCat === c ? C.bg : C.subtext} />
            <Text style={{ color: filterCat === c ? C.bg : C.subtext, fontSize: fs(11), fontWeight: filterCat === c ? '700' : '500' }}>{t('categories')[c] || c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {stats && (
        <View style={{ flexDirection: 'row', paddingHorizontal: s(16), paddingTop: s(12), gap: s(8) }}>
          <View style={{ flex: 1, backgroundColor: C.card, borderRadius: s(12), borderWidth: 1, borderColor: C.cardBorder, padding: s(12) }}>
            <Text style={{ color: C.subtext, fontSize: fs(10), textTransform: 'uppercase', fontWeight: '600' }}>{t('totalExpenses')}</Text>
            <Text style={{ color: C.red, fontSize: fs(18), fontWeight: '800', marginTop: 2 }}>{stats.total_expenses.toFixed(2)} {t('tnDinar')}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: C.card, borderRadius: s(12), borderWidth: 1, borderColor: C.cardBorder, padding: s(12) }}>
            <Text style={{ color: C.subtext, fontSize: fs(10), textTransform: 'uppercase', fontWeight: '600' }}>{t('netProfit')}</Text>
            <Text style={{ color: stats.net_profit >= 0 ? C.green : C.red, fontSize: fs(18), fontWeight: '800', marginTop: 2 }}>
              {stats.net_profit.toFixed(2)} {t('tnDinar')}</Text>
          </View>
        </View>
      )}

      <FlatList
        data={expenses}
        keyExtractor={i => String(i.id)}
        contentContainerStyle={{ paddingHorizontal: s(16), paddingTop: s(12), paddingBottom: s(80), maxWidth: isTablet ? 600 : '100%', alignSelf: isTablet ? 'center' : 'stretch' }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.gold} />}
        ListHeaderComponent={stats?.by_category ? <CategoryPie stats={stats} C={C} /> : null}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: s(40) }}>
            <Ionicons name="cash-outline" size={s(48)} color={C.muted} />
            <Text style={{ color: C.subtext, fontSize: fs(16), fontWeight: '600', marginTop: s(12) }}>{t('noExpenses')}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ backgroundColor: C.card, borderColor: C.cardBorder, borderWidth: 1, borderRadius: s(14), padding: s(14), marginBottom: s(8), flexDirection: 'row', alignItems: 'center', gap: s(12) }}>
            <View style={{ width: s(40), height: s(40), borderRadius: s(10), backgroundColor: C.surface, justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name={CAT_ICONS[item.category] || 'ellipsis-horizontal'} size={fs(18)} color={C.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.white, fontSize: fs(14), fontWeight: '600' }} numberOfLines={1}>{item.description}</Text>
              <View style={{ flexDirection: 'row', gap: s(8), marginTop: 2 }}>
                <Text style={{ color: C.subtext, fontSize: fs(11) }}>{t('categories')[item.category] || item.category}</Text>
                <Text style={{ color: C.muted, fontSize: fs(11) }}>{item.expense_date}</Text>
              </View>
            </View>
            <Text style={{ color: C.red, fontSize: fs(16), fontWeight: '700' }}>-{item.amount.toFixed(2)}</Text>
            <TouchableOpacity onPress={() => handleDelete(item.id)}>
              <Ionicons name="trash-outline" size={fs(18)} color={C.muted} />
            </TouchableOpacity>
          </View>
        )}
      />

      <TouchableOpacity style={{ position: 'absolute', bottom: s(20), right: s(20), backgroundColor: C.gold, width: s(56), height: s(56), borderRadius: s(28), justifyContent: 'center', alignItems: 'center', elevation: 8 }}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setModalVisible(true); }}>
        <Ionicons name="add" size={s(28)} color={C.bg} />
      </TouchableOpacity>

      <AddExpenseModal visible={modalVisible} onClose={(saved) => { setModalVisible(false); if (saved) load(); }} C={C} isSmall={isSmall} />
    </SafeAreaView>
  );
}

const ss = StyleSheet.create({
  container: { flex: 1 },
});
