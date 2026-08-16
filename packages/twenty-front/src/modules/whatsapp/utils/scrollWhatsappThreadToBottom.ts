export const scrollWhatsappThreadToBottom = (
  scrollWrapperElement: HTMLElement,
) => {
  scrollWrapperElement.scrollTop = scrollWrapperElement.scrollHeight;
};
