import { StyleSheet, Dimensions } from "react-native";

const CARD_W = Dimensions.get("screen").width / 2 - 24;

export const inventoryStyles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#f5f5f5" },
  list: { padding: 16 },
  row: { justifyContent: "space-between", marginBottom: 16 },
  card: {
    width: CARD_W,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    elevation: 2,
    position: "relative",
    overflow: "visible",
  },
  editBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    padding: 4,
    zIndex: 10,
    elevation: 10,
  },
  img: {
    width: CARD_W - 24,
    height: CARD_W - 24,
    borderRadius: 8,
    marginBottom: 8,
  },
  name: { fontSize: 14, textAlign: "center", fontWeight: "600" },
  stock: { marginTop: 4, color: "#666" },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },

  badge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#28A745",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeTxt: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
});
