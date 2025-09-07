// Basic test to ensure Jest is working
describe('Basic Tests', () => {
  it('should pass a basic test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should handle string operations', () => {
    const greeting = 'مرحبا'
    expect(greeting).toBe('مرحبا')
    expect(greeting.length).toBeGreaterThan(0)
  })

  it('should handle arrays', () => {
    const numbers = [1, 2, 3, 4, 5]
    expect(numbers).toHaveLength(5)
    expect(numbers).toContain(3)
  })

  it('should handle objects', () => {
    const user = {
      name: 'أحمد',
      role: 'admin',
      active: true
    }
    
    expect(user).toHaveProperty('name')
    expect(user.name).toBe('أحمد')
    expect(user.active).toBe(true)
  })
})
