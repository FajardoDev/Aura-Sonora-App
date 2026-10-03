import { ReactElement, useCallback, useEffect, useMemo, useRef } from "react";
import { FlatList, View } from "react-native";
import { ThemedView } from "@/presentation/theme/components/themed-view";

type Row<T> = { kind: "navigation" } | { kind: "intro" } | { kind: "item"; item: T };

export interface PodcastSectionLayout {
  header: ReactElement;
  navigation: ReactElement;
  active: boolean;
  bottomInset: number;
}

interface Props<T> extends PodcastSectionLayout {
  items: T[];
  itemKey: (item: T) => string;
  renderItem: (item: T, index: number) => ReactElement;
  intro?: ReactElement;
  footer?: ReactElement;
  empty?: ReactElement;
  targetIndex?: number;
  targetKey?: string;
}

// One virtualized vertical list per section. Header scrolls; navigation stays visible.
export default function PodcastSectionList<T>({
  header, navigation, active, bottomInset, items, itemKey, renderItem,
  intro, footer, empty, targetIndex = -1, targetKey,
}: Props<T>) {
  const list = useRef<FlatList<Row<T>>>(null);
  const offset = useRef(0);
  const reachedTarget = useRef<string | undefined>(undefined);
  const targetAttempts = useRef(0);
  const rows = useMemo<Row<T>[]>(() => [
    { kind: "navigation" }, { kind: "intro" },
    ...items.map(item => ({ kind: "item" as const, item })),
  ], [items]);

  useEffect(() => {
    if (!active) return;
    list.current?.scrollToOffset({ offset: offset.current, animated: false });
  }, [active]);

  const reachTarget = useCallback(() => {
    if (!active || !targetKey || targetIndex < 0 || reachedTarget.current === targetKey || targetAttempts.current >= 5) return;
    targetAttempts.current += 1;
    list.current?.scrollToIndex({ index: targetIndex + 2, animated: false, viewOffset: 72 });
  }, [active, targetKey, targetIndex]);

  useEffect(() => {
    targetAttempts.current = 0;
    const frame = requestAnimationFrame(reachTarget);
    return () => cancelAnimationFrame(frame);
  }, [reachTarget]);

  return <FlatList
    ref={list}
    data={rows}
    style={{ flex: 1 }}
    ListHeaderComponent={header}
    stickyHeaderIndices={[1]}
    keyExtractor={row => row.kind === "item" ? `item:${itemKey(row.item)}` : row.kind}
    renderItem={({ item, index }) => {
      if (item.kind === "navigation") return <ThemedView>{navigation}</ThemedView>;
      if (item.kind === "intro") return <View>{intro}{!items.length && empty}</View>;
      return renderItem(item.item, index - 2);
    }}
    ListFooterComponent={footer}
    contentContainerStyle={{ paddingBottom: bottomInset }}
    showsVerticalScrollIndicator={false}
    keyboardShouldPersistTaps="handled"
    initialNumToRender={8}
    windowSize={7}
    onScroll={event => { if (active) offset.current = event.nativeEvent.contentOffset.y; }}
    scrollEventThrottle={32}
    onLayout={() => {
      if (active) list.current?.scrollToOffset({ offset: offset.current, animated: false });
    }}
    onContentSizeChange={reachTarget}
    onViewableItemsChanged={({ viewableItems }) => {
      if (active && targetKey && targetIndex >= 0 && viewableItems.some(row => row.index === targetIndex + 2)) {
        reachedTarget.current = targetKey;
      } else if (active && targetKey && targetIndex >= 0 && targetAttempts.current > 0 && targetAttempts.current < 5) {
        reachTarget();
      }
    }}
    onScrollToIndexFailed={({ averageItemLength, index }) => {
      list.current?.scrollToOffset({ offset: Math.max(0, averageItemLength * index - 72), animated: false });
    }}
  />;
}
