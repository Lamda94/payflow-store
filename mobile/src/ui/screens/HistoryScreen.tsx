import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppSelector } from '../../store/hooks';
import { selectTransactionHistory } from '../../store/slices/transactionSlice';
import { formatMoney } from '../../domain/money';
import type { TransactionRecord, TransactionStatus } from '../../domain/types';
import { colors, spacing, typography } from '../theme';

const STATUS_COLOR: Record<TransactionStatus, string> = {
  APPROVED: colors.success,
  DECLINED: colors.danger,
  ERROR: colors.danger,
  PENDING: colors.textSecondary,
};

function formatDay(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString();
}

function formatFull(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleString();
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function HistoryItem({ record }: { record: TransactionRecord }) {
  const [expanded, setExpanded] = useState(false);

  // Records persisted by earlier app versions have no productName.
  const title =
    record.productName !== undefined
      ? record.quantity !== undefined && record.quantity > 1
        ? `${record.productName} × ${record.quantity}`
        : record.productName
      : `Ref. ${record.reference}`;
  const placedAt = formatFull(record.createdAt);

  return (
    <Pressable
      testID="history-item"
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${record.status}. Tap to ${
        expanded ? 'hide' : 'show'
      } details`}
      style={styles.item}
      onPress={() => setExpanded(current => !current)}
    >
      <View style={styles.itemHeader}>
        <View style={styles.itemLeft}>
          <Text style={styles.itemTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.itemDate}>{formatDay(record.createdAt)}</Text>
        </View>
        <View style={styles.itemRight}>
          <Text style={styles.itemAmount}>
            {formatMoney(record.amountInCents, record.currency)}
          </Text>
          <Text style={[styles.itemStatus, { color: STATUS_COLOR[record.status] }]}>
            {record.status}
          </Text>
        </View>
        <Text style={styles.chevron}>{expanded ? '▾' : '▸'}</Text>
      </View>

      {expanded && (
        <View style={styles.detail} testID="history-item-detail">
          {record.quantity !== undefined && (
            <DetailRow label="Quantity" value={String(record.quantity)} />
          )}
          {placedAt !== '' && <DetailRow label="Placed at" value={placedAt} />}
          <DetailRow label="Reference" value={record.reference} />
          <DetailRow label="Transaction ID" value={record.id} />
        </View>
      )}
    </Pressable>
  );
}

function ItemSeparator() {
  return <View style={styles.separator} />;
}

export function HistoryScreen() {
  const history = useAppSelector(selectTransactionHistory);

  if (history.length === 0) {
    return (
      <View style={styles.center} testID="history-empty">
        <Text style={styles.emptyTitle}>No purchases yet</Text>
        <Text style={styles.emptyMessage}>
          Your completed payments will appear here.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      testID="history-list"
      style={styles.list}
      contentContainerStyle={styles.listContent}
      data={history}
      keyExtractor={item => item.id}
      renderItem={({ item }) => <HistoryItem record={item} />}
      ItemSeparatorComponent={ItemSeparator}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.md,
  },
  item: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  itemTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  itemDate: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  itemAmount: {
    ...typography.body,
    color: colors.textPrimary,
  },
  itemStatus: {
    ...typography.caption,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  chevron: {
    ...typography.body,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  detail: {
    marginTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: spacing.xs,
  },
  detailLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginRight: spacing.md,
  },
  detailValue: {
    ...typography.caption,
    color: colors.textPrimary,
    flexShrink: 1,
    textAlign: 'right',
  },
  separator: {
    height: spacing.sm,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  emptyTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyMessage: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
