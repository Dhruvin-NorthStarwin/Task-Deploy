import { describe, it, expect } from 'vitest';
import App from '../App';

describe('App Component', () => {
  it('renders correctly', () => {
    const { container } = render(<App />);
    expect(container).toBeInTheDocument();
  });
});