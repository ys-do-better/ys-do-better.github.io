import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Svg, Rect, G, Text as SvgText, Path } from 'react-native-svg';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/theme';
import { useBooks } from '../../src/hooks/useBooks';
import type { Book } from '../../src/types';

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  unread: { label: '待读', color: colors.textMuted, icon: '\u{1F4DA}' },
  reading: { label: '在读', color: colors.info, icon: '\u{1F4D6}' },
  finished: { label: '已读', color: colors.success, icon: '\u{2705}' },
};

export default function BooksScreen() {
  const { books, loading, updateProgress, addBook, deleteBook } = useBooks();
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [editingPage, setEditingPage] = useState(false);
  const [pageInput, setPageInput] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newPublisher, setNewPublisher] = useState('');
  const [newTotalPages, setNewTotalPages] = useState('');
  const [newStatus, setNewStatus] = useState<'unread' | 'reading' | 'finished'>('unread');

  const readingCount = books.filter((b) => b.status === 'reading').length;
  const finishedCount = books.filter((b) => b.status === 'finished').length;
  const unreadCount = books.filter((b) => b.status === 'unread').length;
  const filtered = filterStatus === 'all' ? books : books.filter((b) => b.status === filterStatus);

  const handleUpdatePage = () => {
    if (!selectedBook || !pageInput) return;
    const page = parseInt(pageInput, 10);
    if (isNaN(page)) return;
    updateProgress(selectedBook.id, page);
    setEditingPage(false);
    setPageInput('');
  };

  const handleAddBook = () => {
    if (!newTitle.trim()) return;
    addBook({
      title: newTitle.trim(),
      author: newAuthor.trim(),
      publisher: newPublisher.trim(),
      totalPages: parseInt(newTotalPages, 10) || undefined,
      currentPage: 0,
      status: newStatus,
    });
    setShowAddForm(false);
    setNewTitle(''); setNewAuthor(''); setNewPublisher(''); setNewTotalPages('');
    setNewStatus('unread');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Reading Stats */}
      <View style={styles.statsSection}>
        {books.length > 0 ? <ReadingGoal goal={{ target: 30, current: finishedCount, year: 2026 }} streak={{ days: 0, lastDate: '' }} /> : null}
        <View style={styles.statsRow}>
          <StatItem label="在读" value={readingCount} color={colors.info} />
          <StatItem label="已读" value={finishedCount} color={colors.success} />
          <StatItem label="待读" value={unreadCount} color={colors.textMuted} />
        </View>
      </View>

      {/* Filter + Add */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
          {[
            { key: 'all', label: '全部' },
            { key: 'reading', label: '在读' },
            { key: 'finished', label: '已读' },
            { key: 'unread', label: '待读' },
          ].map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, filterStatus === f.key && { backgroundColor: colors.primaryBg, borderColor: colors.primary }]}
              onPress={() => setFilterStatus(f.key)}
            >
              <Text style={[styles.filterChipText, filterStatus === f.key && { color: colors.primaryDark }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
        ))}
      </ScrollView>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddForm(true)}>
          <Text style={styles.addBtnText}>+ 添加</Text>
        </TouchableOpacity>
      </View>

      {/* Book List */}
      <View style={styles.listContent}>
        {filtered.map((item) => {
          const config = statusConfig[item.status];
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.bookCard}
              onPress={() => setSelectedBook(item)}
              activeOpacity={0.7}
            >
              <View style={[styles.bookCover, { backgroundColor: config.color + '18' }]}>
                <Text style={{ fontSize: 28 }}>{config.icon}</Text>
              </View>
              <View style={styles.bookInfo}>
                <Text style={styles.bookTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.bookAuthor}>{item.author}</Text>
                <View style={styles.bookFooter}>
                  <View style={[styles.statusChip, { backgroundColor: config.color + '18' }]}>
                    <Text style={[styles.statusChipText, { color: config.color }]}>{config.label}</Text>
                  </View>
                  {item.status === 'reading' && item.progress !== undefined && (
                    <View style={styles.progressRow}>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${item.progress}%` }]} />
                      </View>
                      <Text style={styles.progressText}>{item.progress}%</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
        {filtered.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>还没有书籍，点击"+ 添加"开始</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddForm(true)}>
              <Text style={styles.addBtnText}>+ 添加书籍</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Reading Distribution Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>阅读分布</Text>
        <View style={styles.chartCard}>
          <ReadingDistributionChart books={books} />
        </View>
      </View>

      <View style={{ height: spacing.xxl }} />

      {/* Book Detail Overlay */}
      {selectedBook && (
        <View style={styles.modalOverlay} onStartShouldSetResponder={() => true}>
          <View style={styles.modalContent}>
            {(() => {
              const config = statusConfig[selectedBook.status];
              return (
                <>
                  <View style={styles.modalBookHeader}>
                    <View style={[styles.modalBookCover, { backgroundColor: config.color + '18' }]}>
                      <Text style={{ fontSize: 40 }}>{config.icon}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: spacing.md }}>
                      <Text style={styles.modalTitle}>{selectedBook.title}</Text>
                      <Text style={styles.modalAuthor}>{selectedBook.author} · {selectedBook.publisher}</Text>
                    </View>
                  </View>

                  {selectedBook.totalPages && selectedBook.status === 'reading' && (
                    <View style={styles.progressSection}>
                      <Text style={styles.progressLabel}>
                        阅读进度: {selectedBook.currentPage || 0} / {selectedBook.totalPages} 页
                      </Text>
                      <View style={styles.progressBarLarge}>
                        <View style={[styles.progressFillLarge, { width: `${selectedBook.progress || 0}%` }]} />
                      </View>
                      <TouchableOpacity
                        style={styles.updateBtn}
                        onPress={() => { setEditingPage(true); setPageInput(String(selectedBook.currentPage || 0)); }}
                      >
                        <Text style={styles.updateBtnText}>更新页码</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {editingPage && (
                    <View style={styles.pageInputRow}>
                      <TextInput
                        style={styles.pageInput}
                        value={pageInput}
                        onChangeText={setPageInput}
                        keyboardType="number-pad"
                        placeholder="页码"
                        autoFocus
                      />
                      <TouchableOpacity style={styles.confirmBtn} onPress={handleUpdatePage}>
                        <Text style={styles.confirmBtnText}>确认</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <View style={styles.modalActions}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => { setShowDeleteConfirm(true); setDeleteTargetId(selectedBook.id); }}>
                      <Text style={styles.actionBtnText}>{'\u{1F5D1}'} 删除</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.modalCloseBtn} onPress={() => { setSelectedBook(null); setEditingPage(false); }}>
                      <Text style={styles.modalCloseText}>关闭</Text>
                    </TouchableOpacity>
                  </View>
                </>
              );
            })()}
          </View>
        </View>
      )}

      {/* Add Book Overlay */}
      {showAddForm && (
        <View style={styles.modalOverlay} onStartShouldSetResponder={() => true}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>添加书籍</Text>
            <TextInput style={styles.pageInput} value={newTitle} onChangeText={setNewTitle} placeholder="书名" autoFocus />
            <TextInput style={styles.pageInput} value={newAuthor} onChangeText={setNewAuthor} placeholder="作者" />
            <TextInput style={styles.pageInput} value={newPublisher} onChangeText={setNewPublisher} placeholder="出版社" />
            <TextInput style={styles.pageInput} value={newTotalPages} onChangeText={setNewTotalPages} placeholder="总页数" keyboardType="number-pad" />
            <View style={styles.typePicker}>
              <Text style={styles.typePickerLabel}>状态：</Text>
              {(['unread', 'reading', 'finished'] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.typeChip, newStatus === s && { backgroundColor: colors.primaryBg }]}
                  onPress={() => setNewStatus(s)}
                >
                  <Text style={[styles.typeChipText, newStatus === s && { color: colors.primaryDark }]}>
                    {statusConfig[s].label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleAddBook}>
              <Text style={styles.confirmBtnText}>添加</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowAddForm(false)}>
              <Text style={styles.modalCancelText}>取消</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Delete Confirm Overlay */}
      {showDeleteConfirm && (
        <View style={styles.deleteOverlay} onStartShouldSetResponder={() => true}>
          <View style={styles.deleteDialog}>
            <Text style={styles.deleteDialogTitle}>确认删除</Text>
            <Text style={styles.deleteDialogText}>确定删除此书籍？</Text>
            <View style={styles.deleteBtnRow}>
              <TouchableOpacity style={styles.deleteCancelBtn} onPress={() => { setShowDeleteConfirm(false); setDeleteTargetId(null); }}>
                <Text style={styles.deleteCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteConfirmBtn} onPress={() => {
                if (deleteTargetId) deleteBook(deleteTargetId);
                setShowDeleteConfirm(false); setDeleteTargetId(null);
                setSelectedBook(null); setEditingPage(false);
              }}>
                <Text style={styles.deleteConfirmText}>删除</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function ReadingGoal({ goal, streak }: { goal: { target: number; current: number; year: number }; streak: { days: number; lastDate: string } }) {
  const progress = Math.min(goal.current / goal.target, 1);
  return (
    <View style={styles.goalCard}>
      <View style={styles.goalLeft}>
        <Text style={styles.goalYear}>{goal.year} 阅读目标</Text>
        <Text style={styles.goalProgress}>{goal.current} / {goal.target} 本</Text>
        <View style={styles.goalBar}>
          <View style={[styles.goalFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>
      <View style={styles.streakBadge}>
        <Text style={{ fontSize: 20 }}>{'\u{1F525}'}</Text>
        <Text style={styles.streakText}>{streak.days} 天连续</Text>
      </View>
    </View>
  );
}

function ReadingDistributionChart({ books }: { books: Book[] }) {
  const chartW = 280;
  const chartH = 100;
  const counts = {
    unread: books.filter((b) => b.status === 'unread').length,
    reading: books.filter((b) => b.status === 'reading').length,
    finished: books.filter((b) => b.status === 'finished').length,
  };
  const total = books.length || 1;
  const barH = 24;
  const gap = 12;

  const items = [
    { label: '已读', count: counts.finished, color: colors.success },
    { label: '在读', count: counts.reading, color: colors.info },
    { label: '待读', count: counts.unread, color: colors.textMuted },
  ];

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={chartW} height={chartH}>
        {items.map((item, i) => {
          const y = i * (barH + gap);
          const w = (item.count / total) * (chartW - 60);
          return (
            <G key={item.label}>
              <SvgText x={0} y={y + barH / 2 + 4} fontSize={11} fill={colors.textSecondary}>{item.label}</SvgText>
              <Rect x={40} y={y} width={Math.max(w, 4)} height={barH} fill={item.color + '44'} rx={4} />
              <Rect x={40} y={y} width={Math.max(w, 4)} height={barH > 6 ? 6 : barH} fill={item.color} rx={3} />
              <SvgText x={45 + Math.max(w, 4)} y={y + barH / 2 + 4} fontSize={11} fill={colors.text}>{item.count}本</SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

function StatItem({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[styles.statItem, { borderTopColor: color }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  statsSection: { padding: spacing.md },
  goalCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, ...shadows.card },
  goalLeft: { flex: 1 },
  goalYear: { ...typography.label, color: colors.text, fontWeight: '600' },
  goalProgress: { ...typography.h3, fontWeight: '700', color: colors.primary, marginVertical: spacing.xs },
  goalBar: { height: 6, backgroundColor: colors.surfaceAlt, borderRadius: 3 },
  goalFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  streakBadge: { alignItems: 'center', backgroundColor: colors.warningBg, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  streakText: { ...typography.caption, color: colors.warning, fontWeight: '500', marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  statItem: { flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', borderTopWidth: 3, ...shadows.card },
  statValue: { ...typography.h2, fontWeight: '700' },
  statLabel: { ...typography.caption, color: colors.textSecondary },
  filterRow: { flexDirection: 'row', paddingHorizontal: spacing.md, alignItems: 'center', marginBottom: spacing.sm },
  filterBar: { flex: 1, flexDirection: 'row' },
  filterChip: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.border, marginRight: spacing.xs },
  filterChipText: { fontSize: 12, color: colors.textSecondary },
  addBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.primaryBg, borderRadius: borderRadius.sm },
  addBtnText: { fontSize: 13, color: colors.primaryDark, fontWeight: '600' },
  listContent: { paddingHorizontal: spacing.md },
  bookCard: { ...shadows.card, flexDirection: 'row', backgroundColor: colors.surface, borderRadius: borderRadius.md, marginBottom: spacing.sm, overflow: 'hidden' },
  bookCover: { width: 56, alignItems: 'center', justifyContent: 'center' },
  bookInfo: { flex: 1, padding: spacing.sm },
  bookTitle: { ...typography.label, color: colors.text },
  bookAuthor: { ...typography.caption, color: colors.textSecondary },
  bookFooter: { marginTop: spacing.xs },
  statusChip: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full },
  statusChipText: { ...typography.caption, fontWeight: '500' },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  progressBar: { flex: 1, height: 4, backgroundColor: colors.surfaceAlt, borderRadius: borderRadius.full },
  progressFill: { height: '100%', borderRadius: borderRadius.full, backgroundColor: colors.info },
  progressText: { ...typography.caption, color: colors.textMuted, marginLeft: spacing.xs, width: 35 },
  emptyText: { ...typography.bodySm, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.md },
  emptyCard: { paddingHorizontal: spacing.md, alignItems: 'center', marginTop: spacing.xxl },
  section: { paddingHorizontal: spacing.md, marginBottom: spacing.lg },
  sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  chartCard: { ...shadows.card, backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end', zIndex: 100 },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.lg, borderTopRightRadius: borderRadius.lg, padding: spacing.lg, paddingBottom: spacing.xl },
  modalBookHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  modalBookCover: { width: 64, height: 64, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { ...typography.h2, color: colors.text },
  modalAuthor: { ...typography.bodySm, color: colors.textSecondary, marginTop: spacing.xs },
  progressSection: { marginTop: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  progressLabel: { ...typography.bodySm, color: colors.textSecondary },
  progressBarLarge: { height: 8, backgroundColor: colors.surfaceAlt, borderRadius: 4, marginVertical: spacing.sm },
  progressFillLarge: { height: '100%', borderRadius: 4, backgroundColor: colors.info },
  updateBtn: { alignSelf: 'flex-start', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.primaryBg, borderRadius: borderRadius.sm },
  updateBtnText: { ...typography.caption, color: colors.primaryDark, fontWeight: '500' },
  pageInputRow: { flexDirection: 'row', marginTop: spacing.sm, gap: spacing.sm },
  pageInput: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, ...typography.body },
  confirmBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: colors.primary, borderRadius: borderRadius.sm },
  confirmBtnText: { ...typography.label, color: '#fff', fontWeight: '500' },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  actionBtn: { flex: 1, padding: spacing.md, backgroundColor: colors.surfaceAlt, borderRadius: borderRadius.md, alignItems: 'center' },
  actionBtnText: { ...typography.label, color: colors.textSecondary },
  modalCloseBtn: { flex: 1, padding: spacing.md, backgroundColor: colors.primaryBg, borderRadius: borderRadius.md, alignItems: 'center' },
  modalCloseText: { ...typography.label, color: colors.primaryDark, fontWeight: '500' },
  modalCancelBtn: { marginTop: spacing.sm, padding: spacing.md, backgroundColor: colors.surfaceAlt, borderRadius: borderRadius.md, alignItems: 'center' },
  modalCancelText: { ...typography.label, color: colors.textSecondary },
  typePicker: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  typePickerLabel: { ...typography.label, color: colors.text, marginRight: spacing.sm },
  typeChip: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.full, backgroundColor: colors.surfaceAlt, marginRight: spacing.xs },
  typeChipText: { ...typography.caption, color: colors.textSecondary },
  deleteOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', zIndex: 200 },
  deleteDialog: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, width: '80%', maxWidth: 320 },
  deleteDialogTitle: { ...typography.h3, color: colors.text, fontWeight: '600', marginBottom: spacing.sm },
  deleteDialogText: { ...typography.bodySm, color: colors.textSecondary, marginBottom: spacing.lg },
  deleteBtnRow: { flexDirection: 'row', gap: spacing.md },
  deleteCancelBtn: { flex: 1, padding: spacing.md, backgroundColor: colors.surfaceAlt, borderRadius: borderRadius.md, alignItems: 'center' },
  deleteCancelText: { ...typography.label, color: colors.textSecondary },
  deleteConfirmBtn: { flex: 1, padding: spacing.md, backgroundColor: colors.danger, borderRadius: borderRadius.md, alignItems: 'center' },
  deleteConfirmText: { ...typography.label, color: '#fff', fontWeight: '500' },
});
