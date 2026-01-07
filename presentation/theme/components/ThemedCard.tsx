import { View, ViewProps } from "react-native";

interface Props extends ViewProps {
  className?: string;
}

export const ThemedCard = ({ className, children, ...rest }: Props) => {
  return (
    <View
      className={`bg-light-background dark:bg-dark-background rounded-xl p-2 shadow shadow-black/5 ${className}`}
      {...rest}
    >
      {children}
    </View>
  );
};
