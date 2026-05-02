import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Svg, Circle, Path, Rect, G, Line, Text as SvgText } from 'react-native-svg';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/theme';
import { usePersistedState } from '../../src/hooks/usePersistedState';
import type { InsurancePolicy, FundAllocation } from '../../src/types';

export default function FinanceScreen() {
  const [selectedView, setSelectedView] = useState<'overview' | 'accounts' | 'insurance'>('overview');
  const [accounts, setAccounts] = usePersistedState<Array<{ id: string; name: string; type: string; balance: number }>>('persist_finance_accounts', []);
  const [insurance, setInsurance] = usePersistedState<InsurancePolicy[]>('persist_finance_insurance', []);
  const [funds, setFunds] = usePersistedState<FundAllocation[]>('persist_finance_funds', []);
  const [spending, setSpending] = usePersistedState<Array<{ id: string; month: string; amount: number }>>('persist_finance_spending', []);

  // Modal states
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAddInsurance, setShowAddInsurance] = useState(false);
  const [showAddSpending, setShowAddSpending] = useState(false);
  const [showEditFunds, setShowEditFunds] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteFn, setDeleteFn] = useState<(() => void) | null>(null);

  // Account form
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountType, setNewAccountType] = useState<'checking' | 'investment' | 'insurance' | 'liability'>('checking');
  const [newAccountBalance, setNewAccountBalance] = useState('');

  // Insurance form
  const [insName, setInsName] = useState('');
  const [insType, setInsType] = useState('');
  const [insProvider, setInsProvider] = useState('');
  const [insured, setInsured] = useState('');
  const [insCoverage, setInsCoverage] = useState('');
  const [insExpiry, setInsExpiry] = useState('');

  // Spending form
  const [spendMonth, setSpendMonth] = useState('');
  const [spendAmount, setSpendAmount] = useState('');

  // Fund edit
  const [editFundItems, setEditFundItems] = useState<FundAllocation[]>([]);

  const totalAsset = accounts.reduce((sum, a) => sum + a.balance, 0);
  const totalInsurance = insurance.reduce((sum, p) => sum + (p.coverageAmount || 0), 0);
  const totalSpending = spending.reduce((s, m) => s + m.amount, 0);
  const avgSpending = spending.length > 0 ? Math.round(totalSpending / spending.length) : 0;
  const stockPct = funds.find((f) => f.category === '股票')?.percentage || 0;

  const handleAddAccount = () => {
    if (!newAccountName.trim()) return;
    setAccounts((prev) => [...prev, { id: String(Date.now()), name: newAccountName.trim(), type: newAccountType, balance: parseFloat(newAccountBalance) || 0 }]);
    setNewAccountName(''); setNewAccountBalance('');
    setShowAddAccount(false);
  };

  const handleAddInsurance = () => {
    if (!insName.trim() || !insCoverage) return;
    const newPolicy: InsurancePolicy = {
      id: String(Date.now()), name: insName.trim(), policyType: insType.trim() || '其他',
      provider: insProvider.trim() || '--', insuredPerson: insured.trim() || '--',
      coverageAmount: parseInt(insCoverage, 10) || 0, startDate: new Date().toISOString().split('T')[0],
      expiryDate: insExpiry || '--', reminderEnabled: true,
    };
    setInsurance((prev) => [...prev, newPolicy]);
    setInsName(''); setInsType(''); setInsProvider(''); setInsured(''); setInsCoverage(''); setInsExpiry('');
    setShowAddInsurance(false);
  };

  const handleAddSpending = () => {
    if (!spendMonth.trim() || !spendAmount) return;
    setSpending((prev) => [...prev, { id: String(Date.now()), month: spendMonth.trim(), amount: parseInt(spendAmount, 10) || 0 }]);
    setSpendMonth(''); setSpendAmount('');
    setShowAddSpending(false);
  };

  const openEditFunds = () => {
    if (funds.length === 0) {
      setEditFundItems([{ category: '股票', percentage: 0 }, { category: '债券', percentage: 0 }, { category: '货币基金', percentage: 0 }, { category: '其他', percentage: 0 }]);
    } else {
      setEditFundItems([...funds]);
    }
    setShowEditFunds(true);
  };

  const handleSaveFunds = () => {
    const total = editFundItems.reduce((s, f) => s + f.percentage, 0);
    if (Math.abs(total - 100) > 0.1) return;
    setFunds(editFundItems.filter((f) => f.percentage > 0));
    setShowEditFunds(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Net Worth Hero */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>净资产</Text>
          <Text style={styles.balanceValue}>¥{totalAsset.toLocaleString()}</Text>
          <View style={styles.balanceStats}>
            <View style={styles.balanceStat}>
              <Text style={styles.balanceStatValue}>¥{totalInsurance.toLocaleString()}</Text>
              <Text style={styles.balanceStatLabel}>总保障额度</Text>
            </View>
            <View style={styles.balanceStat}>
              <Text style={styles.balanceStatValue}>¥{avgSpending.toLocaleString()}</Text>
              <Text style={styles.balanceStatLabel}>月均支出</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          {[{ key: 'overview', label: '总览' }, { key: 'accounts', label: '账户' }, { key: 'insurance', label: '保险' }].map((t) => (
            <TouchableOpacity key={t.key} style={[styles.tab, selectedView === t.key && styles.activeTab]} onPress={() => setSelectedView(t.key as any)}>
              <Text style={[styles.tabText, selectedView === t.key && { color: colors.primaryDark, fontWeight: '600' }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Overview */}
        {selectedView === 'overview' && (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>月度支出趋势</Text>
                <TouchableOpacity style={styles.addBtnSmall} onPress={() => setShowAddSpending(true)}>
                  <Text style={styles.addBtnSmallText}>+ 记录</Text>
                </TouchableOpacity>
              </View>
              {spending.length > 0 ? (
                <View style={styles.chartCard}>
                  <SpendingChart data={spending} />
                </View>
              ) : (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>暂无支出记录</Text>
                </View>
              )}
              {spending.map((s) => (
                <TouchableOpacity key={s.id} style={styles.spendingRow} onLongPress={() => {
                  setShowDeleteConfirm(true);
                  setDeleteFn(() => () => setSpending((prev) => prev.filter((x) => x.id !== s.id)));
                }}>
                  <Text style={styles.spendingMonth}>{s.month}</Text>
                  <Text style={styles.spendingAmount}>¥{s.amount.toLocaleString()}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>资产分布</Text>
                <TouchableOpacity style={styles.addBtnSmall} onPress={openEditFunds}>
                  <Text style={styles.addBtnSmallText}>编辑</Text>
                </TouchableOpacity>
              </View>
              {funds.length > 0 ? (
                <View style={styles.chartCard}>
                  <View style={{ alignItems: 'center' }}>
                    <AssetPieChart data={funds} />
                  </View>
                </View>
              ) : (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>暂无资产分布数据</Text>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>风险评估</Text>
              {funds.length > 0 ? (
                <RiskLevel stocks={stockPct} />
              ) : (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>请先编辑资产分布以评估风险</Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* Accounts */}
        {selectedView === 'accounts' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>账户明细</Text>
              <TouchableOpacity style={styles.addAccountBtn} onPress={() => setShowAddAccount(true)}>
                <Text style={styles.addAccountText}>+ 添加</Text>
              </TouchableOpacity>
            </View>
            {accounts.length > 0 ? accounts.map((a) => (
              <TouchableOpacity key={a.id} style={styles.accountRow} onLongPress={() => {
                setShowDeleteConfirm(true);
                setDeleteFn(() => () => setAccounts((prev) => prev.filter((x) => x.id !== a.id)));
              }}>
                <View>
                  <Text style={styles.accountName}>{a.name}</Text>
                  <Text style={styles.accountType}>{typeLabel(a.type)}</Text>
                </View>
                <Text style={[styles.accountBalance, a.balance < 0 && { color: colors.danger }]}>
                  {a.balance < 0 ? '-' : ''}¥{Math.abs(a.balance).toLocaleString()}
                </Text>
              </TouchableOpacity>
            )) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>暂无账户，点击上方"+ 添加"开始</Text>
              </View>
            )}
          </View>
        )}

        {/* Insurance */}
        {selectedView === 'insurance' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>保险保障墙</Text>
              <TouchableOpacity style={styles.addAccountBtn} onPress={() => setShowAddInsurance(true)}>
                <Text style={styles.addAccountText}>+ 添加</Text>
              </TouchableOpacity>
            </View>
            {insurance.length > 0 ? insurance.map((p) => (
              <TouchableOpacity key={p.id} style={styles.insuranceCard} onLongPress={() => {
                setShowDeleteConfirm(true);
                setDeleteFn(() => () => setInsurance((prev) => prev.filter((x) => x.id !== p.id)));
              }}>
                <View style={styles.insuranceHeader}>
                  <Text style={styles.insuranceName}>{p.name}</Text>
                  {p.reminderEnabled && <Text style={styles.insuranceBadge}>提醒</Text>}
                </View>
                <Text style={styles.insuranceMeta}>{p.policyType} · {p.provider} · {p.insuredPerson}</Text>
                <View style={styles.insuranceFooter}>
                  <Text style={styles.insuranceExpiry}>到期: {p.expiryDate}</Text>
                  <Text style={styles.insuranceCoverage}>保额: ¥{(p.coverageAmount || 0).toLocaleString()}</Text>
                </View>
              </TouchableOpacity>
            )) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>暂无保险记录</Text>
              </View>
            )}
          </View>
        )}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      {/* Add Account Form */}
      {showAddAccount && (
        <View style={styles.modalOverlay} onStartShouldSetResponder={() => true}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>添加账户</Text>
            <Text style={styles.modalLabel}>账户名称</Text>
            <TextInput style={styles.modalInput} value={newAccountName} onChangeText={setNewAccountName} placeholder="如：招商银行" autoFocus />
            <Text style={styles.modalLabel}>余额</Text>
            <TextInput style={styles.modalInput} value={newAccountBalance} onChangeText={setNewAccountBalance} placeholder="如：50000" keyboardType="number-pad" />
            <Text style={styles.modalLabel}>类型</Text>
            <View style={styles.typePicker}>
              {(['checking', 'investment', 'insurance', 'liability'] as const).map((t) => (
                <TouchableOpacity key={t} style={[styles.typeChip, newAccountType === t && { backgroundColor: colors.primaryBg }]} onPress={() => setNewAccountType(t)}>
                  <Text style={[styles.typeChipText, newAccountType === t && { color: colors.primaryDark }]}>{typeLabel(t)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleAddAccount}>
              <Text style={styles.modalSaveText}>添加</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowAddAccount(false)}>
              <Text style={styles.modalCancelText}>取消</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Add Insurance Form */}
      {showAddInsurance && (
        <View style={styles.modalOverlay} onStartShouldSetResponder={() => true}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>添加保险</Text>
            <Text style={styles.modalLabel}>保险名称</Text>
            <TextInput style={styles.modalInput} value={insName} onChangeText={setInsName} placeholder="如：百万医疗险" autoFocus />
            <Text style={styles.modalLabel}>保险类型</Text>
            <TextInput style={styles.modalInput} value={insType} onChangeText={setInsType} placeholder="如：医疗险" />
            <Text style={styles.modalLabel}>保险公司</Text>
            <TextInput style={styles.modalInput} value={insProvider} onChangeText={setInsProvider} placeholder="如：平安保险" />
            <Text style={styles.modalLabel}>被保险人</Text>
            <TextInput style={styles.modalInput} value={insured} onChangeText={setInsured} placeholder="如：闫石" />
            <Text style={styles.modalLabel}>保额（元）</Text>
            <TextInput style={styles.modalInput} value={insCoverage} onChangeText={setInsCoverage} placeholder="如：2000000" keyboardType="number-pad" />
            <Text style={styles.modalLabel}>到期日期</Text>
            <TextInput style={styles.modalInput} value={insExpiry} onChangeText={setInsExpiry} placeholder="YYYY-MM-DD" />
            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleAddInsurance}>
              <Text style={styles.modalSaveText}>添加</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowAddInsurance(false)}>
              <Text style={styles.modalCancelText}>取消</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Add Spending Form */}
      {showAddSpending && (
        <View style={styles.modalOverlay} onStartShouldSetResponder={() => true}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>添加支出记录</Text>
            <Text style={styles.modalLabel}>月份</Text>
            <TextInput style={styles.modalInput} value={spendMonth} onChangeText={setSpendMonth} placeholder="如：1月" autoFocus />
            <Text style={styles.modalLabel}>金额（元）</Text>
            <TextInput style={styles.modalInput} value={spendAmount} onChangeText={setSpendAmount} placeholder="如：3500" keyboardType="number-pad" />
            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleAddSpending}>
              <Text style={styles.modalSaveText}>添加</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowAddSpending(false)}>
              <Text style={styles.modalCancelText}>取消</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Edit Funds Form */}
      {showEditFunds && (
        <View style={styles.modalOverlay} onStartShouldSetResponder={() => true}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>编辑资产分布</Text>
            {editFundItems.map((item, i) => (
              <View key={item.category} style={styles.fundEditRow}>
                <Text style={styles.fundEditLabel}>{item.category}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                  <TouchableOpacity style={styles.fundMinus} onPress={() => setEditFundItems((prev) => prev.map((f, j) => j === i ? { ...f, percentage: Math.max(0, f.percentage - 1) } : f))}>
                    <Text style={styles.fundMinusText}>-</Text>
                  </TouchableOpacity>
                  <TextInput style={styles.fundPercentInput} value={String(item.percentage)} keyboardType="number-pad" onChangeText={(val) => { const n = parseInt(val, 10); if (!isNaN(n)) setEditFundItems((prev) => prev.map((f, j) => j === i ? { ...f, percentage: Math.min(100, n) } : f)); }} />
                  <Text style={styles.fundPercentSign}>%</Text>
                  <TouchableOpacity style={styles.fundPlus} onPress={() => setEditFundItems((prev) => prev.map((f, j) => j === i ? { ...f, percentage: Math.min(100, f.percentage + 1) } : f))}>
                    <Text style={styles.fundPlusText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <Text style={styles.fundTotal}>合计: {editFundItems.reduce((s, f) => s + f.percentage, 0)}%</Text>
            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveFunds}>
              <Text style={styles.modalSaveText}>保存</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowEditFunds(false)}>
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
            <Text style={styles.deleteDialogText}>确定删除此记录？</Text>
            <View style={styles.deleteBtnRow}>
              <TouchableOpacity style={styles.deleteCancelBtn} onPress={() => { setShowDeleteConfirm(false); setDeleteFn(null); }}>
                <Text style={styles.deleteCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteConfirmBtn} onPress={() => {
                if (deleteFn) deleteFn();
                setShowDeleteConfirm(false); setDeleteFn(null);
              }}>
                <Text style={styles.deleteConfirmText}>删除</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

function SpendingChart({ data }: { data: { id: string; month: string; amount: number }[] }) {
  const chartW = 300;
  const chartH = 130;
  const pad = { l: 40, r: 10, t: 10, b: 25 };
  const innerW = chartW - pad.l - pad.r;
  const innerH = chartH - pad.t - pad.b;
  const maxAmount = Math.max(...data.map((d) => d.amount)) * 1.2;
  const barW = 28;
  const gap = (innerW - data.length * barW) / (data.length + 1);

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={chartW} height={chartH}>
        {[0.25, 0.5, 0.75, 1].map((pct, i) => {
          const y = pad.t + innerH * (1 - pct);
          return <Line key={i} x1={pad.l} y1={y} x2={chartW - pad.r} y2={y} stroke={colors.borderLight} strokeWidth={0.5} strokeDasharray="3,3" />;
        })}
        {data.map((d, i) => {
          const x = pad.l + gap + i * (barW + gap);
          const barH = (d.amount / maxAmount) * innerH;
          const y = pad.t + innerH - barH;
          return (
            <G key={d.month}>
              <Rect x={x} y={y} width={barW} height={barH} fill={colors.finance + '44'} rx={4} />
              <Rect x={x} y={y} width={barW} height={barH > 8 ? 8 : barH} fill={colors.finance} rx={4} />
              <SvgText x={x + barW / 2} y={chartH - 5} fontSize={9} fill={colors.textMuted} textAnchor="middle">{d.month}</SvgText>
              <SvgText x={x + barW / 2} y={y - 5} fontSize={9} fill={colors.textSecondary} textAnchor="middle">¥{d.amount}</SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

function AssetPieChart({ data }: { data: FundAllocation[] }) {
  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const r = 60;
  let startAngle = 0;

  return (
    <View>
      <Svg width={size} height={size}>
        {data.map((item, i) => {
          const sweepAngle = (item.percentage / 100) * 360;
          const startRad = (startAngle - 90) * (Math.PI / 180);
          const endRad = (startAngle + sweepAngle - 90) * (Math.PI / 180);
          const largeArc = sweepAngle > 180 ? 1 : 0;
          const x1 = cx + r * Math.cos(startRad);
          const y1 = cy + r * Math.sin(startRad);
          const x2 = cx + r * Math.cos(endRad);
          const y2 = cy + r * Math.sin(endRad);
          startAngle += sweepAngle;
          if (item.percentage === 100) return <Circle key={i} cx={cx} cy={cy} r={r} fill={pieColors[i]} />;
          return <Path key={i} d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`} fill={pieColors[i]} />;
        })}
      </Svg>
      <View style={styles.pieLegend}>
        {data.map((item, i) => (
          <View key={item.category} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: pieColors[i] }]} />
            <Text style={styles.legendText}>{item.category} {item.percentage}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function RiskLevel({ stocks }: { stocks: number }) {
  let level: string; let levelColor: string; let advice: string;
  if (stocks > 60) { level = '高风险'; levelColor = colors.danger; advice = '建议降低股票仓位，增加债券配置'; }
  else if (stocks > 40) { level = '中高风险'; levelColor = colors.warning; advice = '可适当分散投资，关注资产配置'; }
  else if (stocks > 20) { level = '中等风险'; levelColor = colors.info; advice = '风险适中，可保持当前配置'; }
  else { level = '低风险'; levelColor = colors.success; advice = '偏保守，可适度增加权益类投资'; }

  return (
    <View style={styles.riskCard}>
      <Text style={[styles.riskLevel, { color: levelColor }]}>{level}</Text>
      <Text style={styles.riskDesc}>股票占比 {stocks}%</Text>
      <Text style={styles.riskAdvice}>{advice}</Text>
      <View style={styles.riskMeter}>
        <View style={styles.riskMeterBg}>
          <View style={[styles.riskMeterFill, { width: `${Math.min(stocks, 100)}%`, backgroundColor: levelColor }]} />
        </View>
      </View>
    </View>
  );
}

function typeLabel(type: string) {
  const map: Record<string, string> = { checking: '活期', investment: '投资', insurance: '保险', liability: '负债' };
  return map[type] || type;
}

const pieColors = [colors.primary, colors.growth, colors.accent, colors.profile];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  balanceCard: { backgroundColor: colors.primary, margin: spacing.md, borderRadius: borderRadius.lg, padding: spacing.xl, alignItems: 'center' },
  balanceLabel: { fontSize: 14, color: '#ffffffCC' },
  balanceValue: { fontSize: 32, fontWeight: '700', color: '#fff', marginTop: spacing.xs },
  balanceStats: { flexDirection: 'row', marginTop: spacing.md, gap: spacing.xl },
  balanceStat: { alignItems: 'center' },
  balanceStatValue: { fontSize: 16, fontWeight: '600', color: '#fff' },
  balanceStatLabel: { fontSize: 11, color: '#ffffffAA' },
  tabBar: { flexDirection: 'row', backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, paddingVertical: spacing.md, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { ...typography.label, color: colors.textSecondary },
  section: { paddingHorizontal: spacing.md, marginBottom: spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  addBtnSmall: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: colors.primaryBg, borderRadius: borderRadius.sm },
  addBtnSmallText: { ...typography.caption, color: colors.primaryDark, fontWeight: '500' },
  addAccountBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: colors.primaryBg, borderRadius: borderRadius.sm },
  addAccountText: { ...typography.caption, color: colors.primaryDark, fontWeight: '500' },
  chartCard: { ...shadows.card, backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md },
  pieLegend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.sm },
  legendRow: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: spacing.xs },
  legendText: { ...typography.caption, color: colors.textSecondary },
  spendingRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.xs, ...shadows.card },
  spendingMonth: { ...typography.label, color: colors.text },
  spendingAmount: { ...typography.label, fontWeight: '600', color: colors.finance },
  accountRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.xs, ...shadows.card },
  accountName: { ...typography.label, color: colors.text },
  accountType: { ...typography.caption, color: colors.textMuted },
  accountBalance: { ...typography.label, fontWeight: '600', color: colors.success },
  insuranceCard: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, ...shadows.card },
  insuranceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  insuranceName: { ...typography.label, color: colors.text },
  insuranceBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full, backgroundColor: colors.successBg, ...typography.caption, color: colors.success },
  insuranceMeta: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  insuranceFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  insuranceExpiry: { ...typography.caption, color: colors.textMuted },
  insuranceCoverage: { ...typography.caption, color: colors.primary, fontWeight: '500' },
  riskCard: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.lg, alignItems: 'center', ...shadows.card },
  riskLevel: { ...typography.h2, fontWeight: '700' },
  riskDesc: { ...typography.bodySm, color: colors.textSecondary, marginTop: spacing.xs },
  riskAdvice: { ...typography.bodySm, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' },
  riskMeter: { width: '80%', marginTop: spacing.md },
  riskMeterBg: { height: 8, backgroundColor: colors.surfaceAlt, borderRadius: 4, overflow: 'hidden' },
  riskMeterFill: { height: '100%', borderRadius: 4 },
  emptyCard: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.xl, alignItems: 'center' },
  emptyText: { ...typography.bodySm, color: colors.textMuted },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end', zIndex: 100 },
  modalSheet: { backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.lg, borderTopRightRadius: borderRadius.lg, padding: spacing.lg, paddingBottom: spacing.xl },
  modalTitle: { ...typography.h2, color: colors.text, marginBottom: spacing.md },
  modalLabel: { ...typography.label, color: colors.textSecondary, marginTop: spacing.sm, marginBottom: spacing.xs },
  modalInput: { borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.sm, padding: spacing.md, ...typography.body, minHeight: 44 },
  modalSaveBtn: { marginTop: spacing.lg, padding: spacing.md, backgroundColor: colors.primary, borderRadius: borderRadius.sm, alignItems: 'center' },
  modalSaveText: { ...typography.label, color: '#fff', fontWeight: '500' },
  modalCancelBtn: { marginTop: spacing.sm, padding: spacing.md, backgroundColor: colors.surfaceAlt, borderRadius: borderRadius.sm, alignItems: 'center' },
  modalCancelText: { ...typography.label, color: colors.textSecondary, fontWeight: '500' },
  typePicker: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  typeChip: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.full, backgroundColor: colors.surfaceAlt },
  typeChipText: { ...typography.caption, color: colors.textSecondary },
  fundEditRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  fundEditLabel: { ...typography.label, color: colors.text },
  fundMinus: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  fundMinusText: { ...typography.label, color: colors.danger, fontWeight: '700' },
  fundPlus: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center' },
  fundPlusText: { ...typography.label, color: colors.primaryDark, fontWeight: '700' },
  fundPercentInput: { width: 50, textAlign: 'center', ...typography.label, borderBottomWidth: 1, borderBottomColor: colors.border },
  fundPercentSign: { ...typography.label, color: colors.textMuted },
  fundTotal: { ...typography.label, color: colors.text, textAlign: 'center', marginTop: spacing.md, fontWeight: '600' },
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
