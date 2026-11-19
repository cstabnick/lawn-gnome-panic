# Platform protos

The API for the gnome platform: one account and gnome per player, and cosmetic unlocks shared by every game.
Proposal and diagrams: [docs/design/gnome-platform.md](../docs/design/gnome-platform.md).

| Package | File | Services |
|---|---|---|
| `gnome.common.v1` | `gnome/common/v1/common.proto` | none (the `Game` enum) |
| `gnome.user.v1` | `gnome/user/v1/user.proto` | `UserService` |
| `gnome.inventory.v1` | `gnome/inventory/v1/catalog.proto` | none (items, slots, trait enums, `TraitQuery`) |
| `gnome.inventory.v1` | `gnome/inventory/v1/inventory.proto` | `CatalogService`, `InventoryService` |

Nothing is generated or implemented yet. When a service is built: `npx @bufbuild/buf lint` and
`npx @bufbuild/buf breaking --against <main>` from this folder, then `buf generate` for TypeScript (Connect-ES).

Rules: never renumber or reuse a field or enum value; add a trait or game by appending a value; a new group of traits gets its own enum.
