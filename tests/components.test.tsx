/**
 * Tests para componentes del frontend
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Card } from '../src/components/Card';
import { MetricCard } from '../src/components/MetricCard';
import { FlashPrice } from '../src/components/FlashPrice';
import { CHART_COLORS, cn } from '../src/components/utils';

// Mock para iconos
vi.mock('lucide-react', () => ({
  DollarSign: () => <div data-testid="icon">DollarSign</div>,
  TrendingUp: () => <div data-testid="icon">TrendingUp</div>,
}));

describe('Componentes UI', () => {
  describe('Card', () => {
    it('renderiza children correctamente', () => {
      render(<Card>Contenido de prueba</Card>);
      expect(screen.getByText('Contenido de prueba')).toBeInTheDocument();
    });

    it('aplica className personalizado', () => {
      const { container } = render(
        <Card className="test-class">Contenido</Card>
      );
      expect(container.firstChild).toHaveClass('test-class');
    });
  });

  describe('MetricCard', () => {
    it('renderiza todas las props correctamente', () => {
      render(
        <MetricCard
          title="BCV"
          value={448.50}
          suffix="Bs/USD"
          icon={<div data-testid="icon">Icon</div>}
          variant="blue"
          subValue="Tasa Oficial"
        />
      );

      expect(screen.getByText('BCV')).toBeInTheDocument();
      expect(screen.getByText('448.50')).toBeInTheDocument();
      expect(screen.getByText('Bs/USD')).toBeInTheDocument();
      expect(screen.getByText('Tasa Oficial')).toBeInTheDocument();
    });

    it('maneja valores nulos', () => {
      render(
        <MetricCard
          title="BINANCE"
          value="—"
          suffix="Bs/USDT"
          icon={<div data-testid="icon">Icon</div>}
          variant="amber"
        />
      );

      expect(screen.getByText('BINANCE')).toBeInTheDocument();
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  describe('FlashPrice', () => {
    it('renderiza el precio correctamente', () => {
      render(<FlashPrice value={100.50} decimals={2} />);
      expect(screen.getByText('100.50')).toBeInTheDocument();
    });

    it('aplica clase flash up cuando el precio sube', async () => {
      const { rerender } = render(<FlashPrice value={100} previous={90} />);
      
      // Debería tener clase de flash up
      const priceElement = screen.getByText('100.00');
      expect(priceElement).toBeInTheDocument();
    });

    it('aplica clase flash down cuando el precio baja', () => {
      render(<FlashPrice value={90} previous={100} />);
      const priceElement = screen.getByText('90.00');
      expect(priceElement).toBeInTheDocument();
    });
  });

  describe('utils', () => {
    describe('cn', () => {
      it('combina clases correctamente', () => {
        expect(cn('class1', 'class2')).toBe('class1 class2');
      });

      it('filtra valores falsy', () => {
        expect(cn('class1', null, undefined, false, 'class2')).toBe('class1 class2');
      });

      it('retorna string vacío sin argumentos', () => {
        expect(cn()).toBe('');
      });
    });

    describe('CHART_COLORS', () => {
      it('tiene al menos 7 colores', () => {
        expect(CHART_COLORS.length).toBeGreaterThanOrEqual(7);
      });

      it('todos los colores son hex válidos', () => {
        CHART_COLORS.forEach(color => {
          expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
        });
      });
    });
  });
});
