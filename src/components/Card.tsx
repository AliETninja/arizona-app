import { StyleSheet, View } from "react-native";
import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { colors, radius, spacing, tints } from "@/theme/colors";

type Props = {
  children?: ReactNode;
  featured?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Card({ children, featured, style }: Props) {
  return (
    <View style={[styles.card, featured && styles.featured, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.base,
    backgroundColor: colors.card,
  },
  featured: {
    borderColor: tints.featured + "90",
    borderTopWidth: 3,
    borderTopColor: tints.featured,
  },
});
