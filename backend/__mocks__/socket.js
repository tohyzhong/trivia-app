export const getSocketIO = vi.fn(() => {
  const mockEmit = vi.fn();
  const mockTo = vi.fn(() => ({
    emit: mockEmit
  }));

  return {
    emit: mockEmit,
    to: mockTo
  };
});

export const getUserSocketMap = vi.fn(() => new Map());

export default {
  getSocketIO,
  getUserSocketMap
};
