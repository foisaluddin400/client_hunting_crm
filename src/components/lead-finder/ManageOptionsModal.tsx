"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Tabs } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/lib/context/toast-context";
import { DEFAULT_BUSINESS_CATEGORIES } from "@/constants/categories";
import { DEFAULT_COUNTRIES } from "@/constants/countries";
import {
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Search,
  X,
  Layers,
  Globe,
  Briefcase,
} from "lucide-react";

interface ManageOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  onCategoriesChange: (newCategories: string[]) => void;
  countries: string[];
  onCountriesChange: (newCountries: string[]) => void;
  initialTab?: "categories" | "countries";
}

export function ManageOptionsModal({
  isOpen,
  onClose,
  categories,
  onCategoriesChange,
  countries,
  onCountriesChange,
  initialTab = "categories",
}: ManageOptionsModalProps) {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<string>(initialTab);

  // Search filter inside manager
  const [searchTerm, setSearchTerm] = useState("");

  // Add state
  const [isAdding, setIsAdding] = useState(false);
  const [newItemName, setNewItemName] = useState("");

  // Edit state
  const [editingItem, setEditingItem] = useState<{
    original: string;
    current: string;
  } | null>(null);

  // Delete confirmation state
  const [deletingItem, setDeletingItem] = useState<{
    type: "category" | "country";
    name: string;
  } | null>(null);

  // Reset confirmation state
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  if (!isOpen) return null;

  const isCategories = activeTab === "categories";
  const currentList = isCategories ? categories : countries;

  const filteredList = currentList.filter((item) =>
    item.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  // Reset local form states when switching tabs
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setIsAdding(false);
    setNewItemName("");
    setEditingItem(null);
    setSearchTerm("");
    setDeletingItem(null);
  };

  // Add Item
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newItemName.trim();
    if (!trimmed) {
      showToast({
        type: "warning",
        title: "Name required",
        message: `Please enter a ${isCategories ? "category" : "country"} name.`,
      });
      return;
    }

    if (
      currentList.some(
        (item) => item.toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      showToast({
        type: "warning",
        title: "Duplicate entry",
        message: `"${trimmed}" already exists in ${isCategories ? "categories" : "countries"}.`,
      });
      return;
    }

    if (isCategories) {
      onCategoriesChange([trimmed, ...categories]);
      showToast({
        type: "success",
        title: "Category added",
        message: `"${trimmed}" has been added to business categories.`,
      });
    } else {
      onCountriesChange([trimmed, ...countries]);
      showToast({
        type: "success",
        title: "Country added",
        message: `"${trimmed}" has been added to countries.`,
      });
    }

    setNewItemName("");
    setIsAdding(false);
  };

  // Save Edited Item
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const trimmed = editingItem.current.trim();
    if (!trimmed) {
      showToast({
        type: "warning",
        title: "Name required",
        message: "Item name cannot be empty.",
      });
      return;
    }

    if (
      trimmed.toLowerCase() !== editingItem.original.toLowerCase() &&
      currentList.some((item) => item.toLowerCase() === trimmed.toLowerCase())
    ) {
      showToast({
        type: "warning",
        title: "Duplicate entry",
        message: `"${trimmed}" already exists.`,
      });
      return;
    }

    if (isCategories) {
      const updated = categories.map((cat) =>
        cat === editingItem.original ? trimmed : cat
      );
      onCategoriesChange(updated);
      showToast({
        type: "success",
        title: "Category updated",
        message: `"${editingItem.original}" updated to "${trimmed}".`,
      });
    } else {
      const updated = countries.map((c) =>
        c === editingItem.original ? trimmed : c
      );
      onCountriesChange(updated);
      showToast({
        type: "success",
        title: "Country updated",
        message: `"${editingItem.original}" updated to "${trimmed}".`,
      });
    }

    setEditingItem(null);
  };

  // Delete Item Execution
  const handleConfirmDelete = () => {
    if (!deletingItem) return;

    if (deletingItem.type === "category") {
      const updated = categories.filter((c) => c !== deletingItem.name);
      onCategoriesChange(updated);
      showToast({
        type: "info",
        title: "Category removed",
        message: `"${deletingItem.name}" was removed from categories.`,
      });
    } else {
      const updated = countries.filter((c) => c !== deletingItem.name);
      onCountriesChange(updated);
      showToast({
        type: "info",
        title: "Country removed",
        message: `"${deletingItem.name}" was removed from countries.`,
      });
    }

    setDeletingItem(null);
  };

  // Reset to Defaults
  const handleResetDefaults = () => {
    if (isCategories) {
      onCategoriesChange(DEFAULT_BUSINESS_CATEGORIES);
      showToast({
        type: "success",
        title: "Categories reset",
        message: "Business categories restored to default list.",
      });
    } else {
      onCountriesChange(DEFAULT_COUNTRIES);
      showToast({
        type: "success",
        title: "Countries reset",
        message: "Target countries restored to default list.",
      });
    }
    setIsResetConfirmOpen(false);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        maxWidth="lg"
        title={
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <span>Manage Categories & Countries</span>
          </div>
        }
        description="Customize available business categories and countries for Google Maps searches."
      >
        <div className="space-y-4">
          {/* Navigation Tabs */}
          <div className="flex items-center justify-between">
            <Tabs
              tabs={[
                {
                  id: "categories",
                  label: "Categories",
                  count: categories.length,
                  icon: <Briefcase className="w-3.5 h-3.5" />,
                },
                {
                  id: "countries",
                  label: "Countries",
                  count: countries.length,
                  icon: <Globe className="w-3.5 h-3.5" />,
                },
              ]}
              activeTab={activeTab}
              onChange={handleTabChange}
            />

            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1 font-medium px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
              title="Reset to default options"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* Action Header & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search ${isCategories ? "categories" : "countries"}...`}
                className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-7 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {!isAdding && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setIsAdding(true);
                  setNewItemName("");
                }}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                className="shrink-0"
              >
                + Add {isCategories ? "Category" : "Country"}
              </Button>
            )}
          </div>

          {/* Add Item Inline Form */}
          {isAdding && (
            <form
              onSubmit={handleAddItem}
              className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-200/80 space-y-2.5 animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-indigo-950">
                  {isCategories ? "New Category Name" : "New Country Name"}
                </label>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder={
                    isCategories
                      ? "e.g. Solar Energy Installers, Bakeries..."
                      : "e.g. United Kingdom, Singapore..."
                  }
                  autoFocus
                  className="flex-1 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-2xs"
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAdding(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="text-xs shrink-0"
                >
                  Add {isCategories ? "Category" : "Country"}
                </Button>
              </div>
            </form>
          )}

          {/* List Area */}
          <div className="max-h-[320px] overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-slate-50/30">
            {filteredList.length > 0 ? (
              filteredList.map((item) => {
                const isEditingThis = editingItem?.original === item;

                if (isEditingThis) {
                  return (
                    <form
                      key={item}
                      onSubmit={handleSaveEdit}
                      className="p-2.5 bg-indigo-50/90 flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={editingItem.current}
                        onChange={(e) =>
                          setEditingItem({ ...editingItem, current: e.target.value })
                        }
                        autoFocus
                        className="flex-1 rounded-lg border border-indigo-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingItem(null)}
                        className="h-8 px-2 text-xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        className="h-8 px-2.5 text-xs shrink-0"
                      >
                        Save
                      </Button>
                    </form>
                  );
                }

                return (
                  <div
                    key={item}
                    className="p-3 flex items-center justify-between hover:bg-white transition-colors group"
                  >
                    <span className="text-xs font-semibold text-slate-800 truncate mr-2">
                      {item}
                    </span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setEditingItem({ original: item, current: item })
                        }
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Edit name"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDeletingItem({
                            type: isCategories ? "category" : "country",
                            name: item,
                          })
                        }
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 space-y-1">
                <p className="font-semibold text-slate-600">No items found</p>
                <p>
                  {searchTerm
                    ? `No matching ${isCategories ? "categories" : "countries"} for "${searchTerm}"`
                    : `No ${isCategories ? "categories" : "countries"} added yet.`}
                </p>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Total: <strong>{currentList.length}</strong> {isCategories ? "categories" : "countries"}
            </span>

            <Button variant="secondary" size="sm" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Item Confirmation Sub-Modal */}
      {deletingItem && (
        <Modal
          isOpen={true}
          onClose={() => setDeletingItem(null)}
          maxWidth="sm"
          title={
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
              <span>Delete this {deletingItem.type}?</span>
            </div>
          }
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete{" "}
              <strong className="text-slate-900">&quot;{deletingItem.name}&quot;</strong>?
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              This {deletingItem.type} will be removed from your available business {deletingItem.type} list in the Lead Finder selector.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeletingItem(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmDelete}
              >
                Delete {deletingItem.type === "category" ? "Category" : "Country"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reset Confirmation Sub-Modal */}
      {isResetConfirmOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsResetConfirmOpen(false)}
          maxWidth="sm"
          title={
            <div className="flex items-center gap-2 text-amber-600">
              <RotateCcw className="w-5 h-5" />
              <span>Reset {isCategories ? "Categories" : "Countries"}?</span>
            </div>
          }
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to reset your {isCategories ? "business categories" : "target countries"} back to the original default list?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsResetConfirmOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleResetDefaults}
              >
                Reset to Defaults
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
