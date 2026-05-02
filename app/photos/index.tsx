import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Image, ScrollView, Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/theme';
import { usePersistedState } from '../../src/hooks/usePersistedState';

interface PhotoItem {
  id: string;
  uri?: string;
  base64?: string;
  createdAt: string;
  location: string;
  tags: string[];
  description: string;
}

const mockPhotos: PhotoItem[] = [
  { id: '1', uri: '', createdAt: '2025-12-20', location: '南京', tags: ['旅行', '风景'], description: '夫子庙夜景' },
  { id: '2', uri: '', createdAt: '2025-12-19', location: '南京', tags: ['旅行'], description: '玄武湖日出' },
  { id: '3', uri: '', createdAt: '2025-11-15', location: '实验室', tags: ['学术'], description: '实验室日常' },
  { id: '4', uri: '', createdAt: '2025-10-01', location: '上海', tags: ['家庭'], description: '外滩夜景' },
  { id: '5', uri: '', createdAt: '2025-09-20', location: '苏州', tags: ['旅行'], description: '拙政园' },
  { id: '6', uri: '', createdAt: '2025-08-10', location: '杭州', tags: ['风景'], description: '西湖' },
];

export default function PhotosScreen() {
  const [photos, setPhotos] = usePersistedState('persist_photos', mockPhotos);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editTags, setEditTags] = useState('');

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('提示', '需要照片权限');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: false,
      quality: 0.85,
      base64: Platform.OS === 'web',
    });

    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];

    const newPhoto: PhotoItem = {
      id: String(Date.now()),
      uri: Platform.OS === 'web' ? undefined : asset.uri,
      base64: Platform.OS === 'web' ? asset.base64 || undefined : undefined,
      createdAt: new Date().toISOString().split('T')[0],
      location: '未知位置',
      tags: [],
      description: '',
    };
    setPhotos((prev) => [newPhoto, ...prev]);
    Alert.alert('成功', '照片已上传');
  };

  const handleSaveEdit = () => {
    if (!selectedPhoto) return;
    const tags = editTags.split(/[,，]/).map((t) => t.trim()).filter(Boolean);
    setPhotos((prev) =>
      prev.map((p) =>
        p.id === selectedPhoto.id
          ? { ...p, description: editDescription, location: editLocation, tags }
          : p
      )
    );
    setSelectedPhoto((prev) => prev ? { ...prev, description: editDescription, location: editLocation, tags } : null);
    setEditMode(false);
  };

  const handleDeletePhoto = (id: string) => {
    Alert.alert('确认', '确定删除此照片？', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => {
        setPhotos((prev) => prev.filter((p) => p.id !== id));
        if (selectedPhoto?.id === id) setSelectedPhoto(null);
      }},
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Toolbar */}
      <View style={styles.toolbar}>
        <Text style={styles.toolbarTitle}>照片集合</Text>
        <TouchableOpacity style={styles.uploadBtn} onPress={handlePickImage}>
          <Text style={styles.uploadBtnText}>+ 上传照片</Text>
        </TouchableOpacity>
      </View>

      {/* Photo Grid */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.countText}>共 {photos.length} 张照片</Text>
        <View style={styles.photoGrid}>
          {photos.map((photo) => (
            <TouchableOpacity
              key={photo.id}
              style={styles.gridCard}
              onPress={() => {
                setSelectedPhoto(photo);
                setEditDescription(photo.description || '');
                setEditLocation(photo.location);
                setEditTags(photo.tags.join(', '));
                setEditMode(false);
              }}
              onLongPress={() => handleDeletePhoto(photo.id)}
              activeOpacity={0.7}
            >
              {photo.base64 ? (
                <Image
                  source={{ uri: `data:image/jpeg;base64,${photo.base64}` }}
                  style={styles.gridImage}
                />
              ) : photo.uri ? (
                <Image source={{ uri: photo.uri }} style={styles.gridImage} />
              ) : (
                <View style={styles.gridPlaceholder}>
                  <Text style={styles.gridPlaceholderText}>{'\u{1F4F7}'}</Text>
                </View>
              )}
              <View style={styles.gridOverlay}>
                <Text style={styles.gridLocation} numberOfLines={1}>{photo.location}</Text>
                <Text style={styles.gridDate}>{photo.createdAt}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      {/* Photo Detail Modal */}
      <Modal visible={!!selectedPhoto} transparent animationType="slide" onRequestClose={() => { setSelectedPhoto(null); setEditMode(false); }}>
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.modalBackBtn} onPress={() => { setSelectedPhoto(null); setEditMode(false); }}>
              <Text style={styles.modalBackText}>{'<'} 返回</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalDeleteBtn} onPress={() => { if (selectedPhoto) handleDeletePhoto(selectedPhoto.id); }}>
              <Text style={styles.modalDeleteText}>删除</Text>
            </TouchableOpacity>
          </View>

          {/* Photo Content */}
          <ScrollView style={styles.modalScroll}>
            {selectedPhoto && (
              <View style={styles.modalBody}>
                {selectedPhoto.base64 && (
                  <Image
                    source={{ uri: `data:image/jpeg;base64,${selectedPhoto.base64}` }}
                    style={styles.modalImage}
                  />
                )}
                {!!selectedPhoto?.uri && !selectedPhoto.base64 && (
                  <Image source={{ uri: selectedPhoto.uri }} style={styles.modalImage} />
                )}
                {!selectedPhoto?.base64 && !selectedPhoto?.uri && (
                  <View style={styles.modalPlaceholder}>
                    <Text style={{ fontSize: 64 }}>{'\u{1F4F7}'}</Text>
                  </View>
                )}

                {editMode ? (
                  <View style={styles.editForm}>
                    <Text style={styles.editLabel}>地点</Text>
                    <TextInput
                      style={styles.editInput}
                      value={editLocation}
                      onChangeText={setEditLocation}
                      placeholder="输入地点..."
                    />
                    <Text style={styles.editLabel}>描述</Text>
                    <TextInput
                      style={[styles.editInput, { minHeight: 80 }]}
                      value={editDescription}
                      onChangeText={setEditDescription}
                      placeholder="输入描述..."
                      multiline
                    />
                    <Text style={styles.editLabel}>标签（用逗号分隔）</Text>
                    <TextInput
                      style={styles.editInput}
                      value={editTags}
                      onChangeText={setEditTags}
                      placeholder="如：旅行, 风景"
                    />
                    <View style={styles.editBtns}>
                      <TouchableOpacity style={styles.editCancelBtn} onPress={() => setEditMode(false)}>
                        <Text style={styles.editCancelText}>取消</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.editSaveBtn} onPress={handleSaveEdit}>
                        <Text style={styles.editSaveText}>保存</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.detailBody}>
                    <View style={styles.detailHeader}>
                      <Text style={styles.detailLocation}>{selectedPhoto.location}</Text>
                      <Text style={styles.detailDate}>{selectedPhoto.createdAt}</Text>
                    </View>
                    <Text style={styles.detailDesc}>
                      {selectedPhoto.description || '暂无描述'}
                    </Text>
                    {selectedPhoto.tags.length > 0 && (
                      <View style={styles.detailTags}>
                        {selectedPhoto.tags.map((t) => (
                          <Text key={t} style={styles.detailTag}>{t}</Text>
                        ))}
                      </View>
                    )}
                    <TouchableOpacity style={styles.detailEditBtn} onPress={() => setEditMode(true)}>
                      <Text style={styles.detailEditText}>编辑信息</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  toolbar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  toolbarTitle: { ...typography.h3, color: colors.text },
  uploadBtn: { marginLeft: 'auto', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.primaryBg, borderRadius: borderRadius.sm },
  uploadBtnText: { ...typography.caption, color: colors.primaryDark, fontWeight: '500' },
  content: { flex: 1 },
  countText: { ...typography.caption, color: colors.textMuted, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: spacing.xs, gap: spacing.xs },
  gridCard: { width: '32%', aspectRatio: 0.8, borderRadius: borderRadius.md, overflow: 'hidden', ...shadows.card },
  gridImage: { width: '100%', height: '75%', backgroundColor: colors.surfaceAlt },
  gridPlaceholder: { width: '100%', height: '75%', backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  gridPlaceholderText: { fontSize: 32 },
  gridOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: spacing.xs, paddingVertical: spacing.xs },
  gridLocation: { fontSize: 11, color: '#fff', fontWeight: '500' },
  gridDate: { fontSize: 9, color: '#ffffffAA' },
  // Modal
  modalContainer: { flex: 1, backgroundColor: colors.surface },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalBackBtn: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  modalBackText: { ...typography.label, color: colors.primary },
  modalDeleteBtn: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  modalDeleteText: { ...typography.label, color: colors.danger, fontWeight: '500' },
  modalScroll: { flex: 1 },
  modalBody: { padding: spacing.md },
  modalImage: { width: '100%', height: 300, borderRadius: borderRadius.md, marginBottom: spacing.md, backgroundColor: colors.surfaceAlt },
  modalPlaceholder: { width: '100%', height: 200, borderRadius: borderRadius.md, marginBottom: spacing.md, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  editForm: {},
  editLabel: { ...typography.label, color: colors.text, marginTop: spacing.md, marginBottom: spacing.xs },
  editInput: { borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.sm, padding: spacing.md, ...typography.body, minHeight: 44 },
  editBtns: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  editCancelBtn: { flex: 1, padding: spacing.md, backgroundColor: colors.surfaceAlt, borderRadius: borderRadius.md, alignItems: 'center' },
  editCancelText: { ...typography.label, color: colors.textSecondary },
  editSaveBtn: { flex: 1, padding: spacing.md, backgroundColor: colors.primary, borderRadius: borderRadius.md, alignItems: 'center' },
  editSaveText: { ...typography.label, color: '#fff', fontWeight: '500' },
  detailBody: {},
  detailHeader: { marginBottom: spacing.md },
  detailLocation: { ...typography.h2, color: colors.text },
  detailDate: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  detailDesc: { ...typography.bodySm, color: colors.textSecondary, lineHeight: 22, marginBottom: spacing.md },
  detailTags: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap', marginBottom: spacing.lg },
  detailTag: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.full, backgroundColor: colors.surfaceAlt, ...typography.caption, color: colors.textSecondary },
  detailEditBtn: { padding: spacing.md, backgroundColor: colors.primaryBg, borderRadius: borderRadius.md, alignItems: 'center' },
  detailEditText: { ...typography.label, color: colors.primaryDark, fontWeight: '500' },
});
