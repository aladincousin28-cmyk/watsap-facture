import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Linking, Alert, useWindowDimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { getBaseUrl, setBaseUrl } from '../api';
import { showToast } from '../components/Toast';
import { getColors, setTheme, getTheme } from '../theme';
import { t, setLanguage, getCurrentLang } from '../i18n';
import { s, fs } from '../responsive';

function useStyles() {
  const C = getColors();
  const { width } = useWindowDimensions();
  return { C, isTablet: width >= 600, isSmall: width < 360 };
}

export default function SettingsScreen({ route }) {
  const { C, isTablet, isSmall } = useStyles();
  const [url, setUrl] = useState(getBaseUrl());
  const [saved, setSaved] = useState(false);
  const [themeMode, setThemeMode] = useState(getTheme());
  const [lang, setLang] = useState(getCurrentLang());

  const onThemeChange = route?.params?.onThemeChange;
  const onLangChange = route?.params?.onLangChange;

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    let clean = url.trim();
    if (!/^https?:\/\//i.test(clean)) clean = 'http://' + clean;
    clean = clean.replace(/\/+$/, '');
    setBaseUrl(clean);
    setUrl(clean);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    const fallback = 'https://watsap-facture-production.up.railway.app';
    setUrl(fallback);
    setBaseUrl(fallback);
    showToast(t('saved'), 'success');
  };

  const toggleTheme = () => {
    const next = themeMode === 'dark' ? 'light' : 'dark';
    setTheme(next);
    setThemeMode(next);
    if (onThemeChange) onThemeChange(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const switchLang = (l) => {
    setLanguage(l);
    setLang(l);
    if (onLangChange) onLangChange(l);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <SafeAreaView style={[ss.container, { backgroundColor: C.bg }]}>
      <ScrollView contentContainerStyle={{ padding: s(16), paddingBottom: s(40), maxWidth: isTablet ? 600 : '100%', alignSelf: isTablet ? 'center' : 'stretch' }}>

        <View style={[ss.section, { backgroundColor: C.card, borderColor: C.cardBorder, padding: s(18), borderRadius: s(16), marginBottom: s(14) }]}>
          <Text style={[ss.sectionTitle, { color: C.white, fontSize: fs(14) }]}>{t('serverUrl')}</Text>
          <Text style={[ss.hint, { color: C.subtext, fontSize: fs(12) }]}>{t('dataWillBeSent')}</Text>
          <View style={[ss.inputWrap, { position: 'relative' }]}>
            <Ionicons name="server-outline" size={fs(18)} color={C.subtext} style={{ position: 'absolute', left: s(14), top: s(14), zIndex: 1 }} />
            <TextInput style={[ss.input, { backgroundColor: C.surface, color: C.white, borderColor: C.cardBorder, padding: s(14), paddingLeft: s(40), borderRadius: s(10), fontSize: fs(13) }]}
              value={url} onChangeText={setUrl} placeholder="http://..." placeholderTextColor={C.muted} autoCapitalize="none" autoCorrect={false} />
          </View>
          <View style={{ flexDirection: 'row', gap: s(10), marginTop: s(12) }}>
            <TouchableOpacity style={[ss.saveBtn, { backgroundColor: C.gold, padding: s(14), borderRadius: s(12) }]} onPress={handleSave}>
              {saved ? (
                <><Ionicons name="checkmark-circle" size={fs(18)} color={C.bg} /><Text style={[ss.saveBtnText, { color: C.bg, fontSize: fs(13) }]}>{t('saved')}</Text></>
              ) : (
                <><Ionicons name="save-outline" size={fs(18)} color={C.bg} /><Text style={[ss.saveBtnText, { color: C.bg, fontSize: fs(13) }]}>{t('save')}</Text></>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={[ss.resetBtn, { backgroundColor: C.surface, borderColor: C.cardBorder, width: s(48), borderRadius: s(12) }]} onPress={handleReset}>
              <Ionicons name="refresh-outline" size={fs(18)} color={C.subtext} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[ss.section, { backgroundColor: C.card, borderColor: C.cardBorder, padding: s(18), borderRadius: s(16), marginBottom: s(14) }]}>
          <Text style={[ss.sectionTitle, { color: C.white, fontSize: fs(14) }]}>{t('settings')}</Text>

          <TouchableOpacity style={[ss.settingRow, { borderBottomColor: C.cardBorder, paddingVertical: s(12) }]} onPress={toggleTheme}>
            <Ionicons name={themeMode === 'dark' ? 'moon' : 'sunny'} size={fs(20)} color={C.gold} />
            <Text style={[ss.settingText, { color: C.text, fontSize: fs(14), flex: 1 }]}>{themeMode === 'dark' ? t('darkMode') : t('lightMode')}</Text>
            <Ionicons name="chevron-forward" size={fs(16)} color={C.muted} />
          </TouchableOpacity>

          <View style={[ss.settingRow, { borderBottomColor: C.cardBorder, paddingVertical: s(12) }]}>
            <Ionicons name="language" size={fs(20)} color={C.gold} />
            <Text style={[ss.settingText, { color: C.text, fontSize: fs(14), flex: 1 }]}>{t('language')}</Text>
            <View style={{ flexDirection: 'row', gap: s(6) }}>
              <TouchableOpacity style={[ss.langChip, lang === 'fr' && { backgroundColor: C.gold },
                { borderColor: C.cardBorder, paddingVertical: s(6), paddingHorizontal: s(10), borderRadius: s(8) }]}
                onPress={() => switchLang('fr')}>
                <Text style={[ss.langChipText, lang === 'fr' && { color: C.bg, fontWeight: '700' }, { color: lang === 'fr' ? C.bg : C.subtext, fontSize: fs(12) }]}>FR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[ss.langChip, lang === 'ar' && { backgroundColor: C.gold },
                { borderColor: C.cardBorder, paddingVertical: s(6), paddingHorizontal: s(10), borderRadius: s(8) }]}
                onPress={() => switchLang('ar')}>
                <Text style={[ss.langChipText, lang === 'ar' && { color: C.bg, fontWeight: '700' }, { color: lang === 'ar' ? C.bg : C.subtext, fontSize: fs(12) }]}>AR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={[ss.section, { backgroundColor: C.card, borderColor: C.cardBorder, padding: s(18), borderRadius: s(16), marginBottom: s(14) }]}>
          <Text style={[ss.sectionTitle, { color: C.white, fontSize: fs(14) }]}>{t('help')}</Text>
          <TouchableOpacity style={[ss.helpRow, { borderBottomColor: C.cardBorder, paddingVertical: s(12) }]} onPress={() => Alert.alert(t('findIp'), t('serverUrl'))}>
            <Ionicons name="help-circle-outline" size={fs(20)} color={C.gold} />
            <Text style={[ss.helpText, { color: C.text, fontSize: fs(14), flex: 1 }]}>{t('findIp')}</Text>
            <Ionicons name="chevron-forward" size={fs(16)} color={C.muted} />
          </TouchableOpacity>
          <TouchableOpacity style={[ss.helpRow, { borderBottomColor: C.cardBorder, paddingVertical: s(12) }]} onPress={() => Linking.openURL('https://wa.me/21623433052')}>
            <Ionicons name="logo-whatsapp" size={fs(20)} color={C.green} />
            <Text style={[ss.helpText, { color: C.text, fontSize: fs(14), flex: 1 }]}>{t('support')}</Text>
            <Ionicons name="chevron-forward" size={fs(16)} color={C.muted} />
          </TouchableOpacity>
        </View>

        <View style={[ss.section, { backgroundColor: C.card, borderColor: C.cardBorder, padding: s(18), borderRadius: s(16), marginBottom: s(14) }]}>
          <Text style={[ss.sectionTitle, { color: C.white, fontSize: fs(14) }]}>{t('about')}</Text>
          <View style={[ss.aboutRow, { paddingVertical: s(8) }]}>
            <Text style={[ss.aboutLabel, { color: C.subtext, fontSize: fs(13) }]}>Version</Text>
            <Text style={[ss.aboutValue, { color: C.white, fontSize: fs(13) }]}>1.0.0</Text>
          </View>
          <View style={[ss.aboutRow, { paddingVertical: s(8) }]}>
            <Text style={[ss.aboutLabel, { color: C.subtext, fontSize: fs(13) }]}>{t('appInfo')}</Text>
            <Text style={[ss.aboutValue, { color: C.white, fontSize: fs(13) }]}>{t('appName')}</Text>
          </View>
          <Text style={[ss.footer, { color: C.muted, fontSize: fs(11), textAlign: 'center', marginTop: s(14) }]}>{t('invoiceAppDesc')}</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const ss = StyleSheet.create({
  container: { flex: 1 },
  section: { borderWidth: 1 },
  sectionTitle: { fontWeight: '700', marginBottom: 10 },
  hint: { lineHeight: 18, marginBottom: 10 },
  inputWrap: {},
  input: { borderWidth: 1 },
  saveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  saveBtnText: { fontWeight: '700' },
  resetBtn: { alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1 },
  settingText: { fontWeight: '500' },
  langChip: { borderWidth: 1 },
  langChipText: { fontWeight: '600' },
  helpRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1 },
  helpText: { fontWeight: '500' },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between' },
  aboutLabel: {},
  aboutValue: { fontWeight: '600' },
  footer: {},
});
