import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
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

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString();
}

function HistoryItem({ record }: { record: TransactionRecord }) {
  // Records persisted by earlier app versions have no productName.
  const title =
    record.productName !== undefined
      ? record.quantity !== undefined && record.quantity > 1
        ? `${record.productName} × ${record.quantity}`
        : record.productName
      : `Ref. ${record.reference}`;

  return (
    <View style={styles.item} testID="history-item">
      <View style={styles.itemLeft}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.itemDate}>{formatDate(record.createdAt)}</Text>
      </View>
      <View style={styles.itemRight}>
        <Text style={styles.itemAmount}>
          {formatMoney(record.amountInCents, record.currency)}
        </Text>
        <Text style={[styles.itemStatus, { color: STATUS_COLOR[record.status] }]}>
          {record.status}
        </Text>
      </View>
    </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
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
