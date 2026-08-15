export function assistantLoadingState(isLoading: boolean) {
  return { showIndicator: isLoading, label: isLoading ? "Thinking" : "" };
}
