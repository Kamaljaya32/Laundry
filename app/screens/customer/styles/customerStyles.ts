import { StyleSheet } from 'react-native';

export const customerStyles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#F6FCFF' },
  list:    { padding: 16, paddingBottom: 100 },

  // Search bar styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',          // vertikal center icon & input
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,            // ruang atas-bawah sama
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 2,                  // shadow Android
  },
  searchIcon: {
    marginRight: 8,                // jarak icon ke input
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,            // hilangkan default padding untuk centering
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
  },

  name:  { fontWeight: '600', fontSize: 16 },
  phone: { color: '#666', marginTop: 2 },

  badgeRow: { flexDirection: 'row', marginTop: 10, gap: 10 },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F0FF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },

  badgeTxt: { color: '#0066FF', fontSize: 12, fontWeight: '600' },

  editBadge: { backgroundColor: '#FFF5E6' },
  editTxt:   { color: '#FF9500', fontSize: 12, fontWeight: '600' },

  delBadge:  { backgroundColor: '#FFF0F0' },
  delTxt:    { color: '#FF3B30', fontSize: 12, fontWeight: '600' },

  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0066FF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
});
