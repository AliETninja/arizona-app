import { FlatList, RefreshControl, StyleSheet } from "react-native";
import type { FlatListProps } from "react-native";
import type { ReactElement } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader, screenStyles } from "@/components/Screen";
import { colors, spacing } from "@/theme/colors";

type Props<T> = Omit<
  FlatListProps<T>,
  "refreshControl" | "refreshing" | "onRefresh" | "ListHeaderComponent"
> & {
  title: string;
  subtitle?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
  header?: ReactElement;
};

export function ListScreen<T>({
  title,
  subtitle,
  refreshing = false,
  onRefresh,
  header,
  contentContainerStyle,
  ...list
}: Props<T>) {
  return (
    <SafeAreaView edges={["top"]} style={screenStyles.safe}>
      <ScreenHeader title={title} subtitle={subtitle} />
      <FlatList
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={header}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          ) : undefined
        }
        contentContainerStyle={[styles.content, contentContainerStyle]}
        {...list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
});
