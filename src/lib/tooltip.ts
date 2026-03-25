export function initTooltips(): void {
  document.addEventListener('click', (e) => {
    const trigger = (e.target as HTMLElement).closest('.tooltip__trigger');

    if (trigger) {
      e.preventDefault();
      const tooltip = trigger.closest('.tooltip')!;
      const isOpen = tooltip.classList.contains('tooltip--open');

      // Close all open tooltips first
      closeAll();

      if (!isOpen) {
        tooltip.classList.add('tooltip--open');
        trigger.setAttribute('aria-expanded', 'true');
      }
      return;
    }

    // Click outside — close all
    if (!(e.target as HTMLElement).closest('.tooltip__content')) {
      closeAll();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAll();

    // Activate trigger on Enter/Space (since it's a span, not a button)
    if (e.key === 'Enter' || e.key === ' ') {
      const trigger = (e.target as HTMLElement).closest('.tooltip__trigger');
      if (trigger) {
        e.preventDefault();
        trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }
    }
  });
}

function closeAll(): void {
  document.querySelectorAll('.tooltip--open').forEach((t) => {
    t.classList.remove('tooltip--open');
    t.querySelector('.tooltip__trigger')?.setAttribute('aria-expanded', 'false');
  });
}
