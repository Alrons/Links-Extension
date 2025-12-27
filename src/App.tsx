import React, { useState, useEffect, useRef } from "react";
import "./App.css";

type LinkItem = { url: string; img: string; title: string };

function App() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; index: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [showModal, setShowModal] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [newUrl, setNewUrl] = useState("");
  const [newTitle, setNewTitle] = useState("");

  const defaultLinks: LinkItem[] = [];

  // === Обёртки для хранения данных ===
  const getStoredLinks = async (): Promise<LinkItem[]> => {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      return new Promise((resolve) => {
        chrome.storage.local.get(["links"], (result) => resolve(result.links || []));
      });
    } else {
      const data = localStorage.getItem("links");
      return data ? JSON.parse(data) : [];
    }
  };

  const saveLinks = async (data: LinkItem[]) => {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ links: data }, () => resolve(true));
      });
    } else {
      localStorage.setItem("links", JSON.stringify(data));
    }
  };

  // === Загрузка при старте ===
  useEffect(() => {
    getStoredLinks().then((stored) => {
      if (stored.length > 0) {
        setLinks(stored);
      } else {
        setLinks(defaultLinks);
        saveLinks(defaultLinks);
      }
    });
  }, []);

  // === Автосохранение при изменении ===
  useEffect(() => {
    if (links.length > 0) {
      saveLinks(links);
    }
  }, [links]);

  // === Контекстное меню ===
  const handleRightClick = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    setContextMenu({ x: e.pageX, y: e.pageY, index });
  };

  const handleEdit = () => {
    if (contextMenu) {
      const link = links[contextMenu.index];
      setEditIndex(contextMenu.index);
      setNewUrl(link.url);
      setNewTitle(link.title);
      setShowModal(true);
      setContextMenu(null);
    }
  };

  const handleDelete = () => {
    if (contextMenu) {
      setLinks(links.filter((_, i) => i !== contextMenu.index));
      setContextMenu(null);
    }
  };

  const handleCloseMenu = () => setContextMenu(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // === Добавление/редактирование ===
  const handleAddClick = () => {
    setEditIndex(null);
    setNewUrl("");
    setNewTitle("");
    setShowModal(true);
  };

  const handleSave = () => {
    if (!newUrl || !newTitle) {
      alert("Заполни все поля!");
      return;
    }

    // Исправляем URL
    let urlString = newUrl.trim();
    if (!/^https?:\/\//i.test(urlString)) {
      urlString = "https://" + urlString;
    }

    let domain: string;
    try {
      domain = new URL(urlString).hostname;
    } catch {
      alert("Некорректный URL");
      return;
    }

    const newLink: LinkItem = {
      url: urlString,
      img: `https://www.google.com/s2/favicons?sz=64&domain=${domain}`,
      title: newTitle,
    };

    if (editIndex !== null) {
      const updated = [...links];
      updated[editIndex] = newLink;
      setLinks(updated);
    } else {
      setLinks([...links, newLink]);
    }

    setShowModal(false);
    setNewUrl("");
    setNewTitle("");
    setEditIndex(null);
  };

  return (
    <>
      <h1 style={{ textAlign: "center", color: "white" }}>Мои ссылки</h1>
      <div className="links-container" onClick={handleCloseMenu}>
        {links.map((link, index) => (
          <a
            className="link-item"
            href={link.url}
            key={index}
            onClick={(e) => {
      e.preventDefault(); // Предотвращаем стандартное поведение ссылки
      window.location.href = link.url; // Перенаправляем на URL
    }}
            rel="noopener noreferrer"
            onContextMenu={(e) => handleRightClick(e, index)}
          >
            <div className="icon">
              <img src={link.img} alt={link.title} />
            </div>
            <div className="title">{link.title}</div>
          </a>
        ))}
        <div className="link-item" onClick={handleAddClick} style={{ cursor: "pointer", fontSize: "40px" }}>
          <div className="icon plus-icon">
            <img src="img/image3 (1).png" className="plus-image" alt="Добавить" />
          </div>
          <div className="title">Добавить</div>
        </div>
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>{editIndex !== null ? "Редактировать" : "Добавить сайт"}</h2>
            <input
              type="text"
              placeholder="URL (https://...)"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
            />
            <input
              type="text"
              placeholder="Название сайта"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <div className="modal-buttons">
              <button onClick={handleSave}>{editIndex !== null ? "Сохранить изменения" : "Сохранить"}</button>
              <button onClick={() => setShowModal(false)}>Отмена</button>
            </div>
          </div>
        </div>
      )}

      {contextMenu && (
        <div className="context-menu" style={{ top: contextMenu.y, left: contextMenu.x }} ref={menuRef}>
          <button onClick={handleEdit}>✏ Редактировать</button>
          <button onClick={handleDelete}>🗑 Удалить</button>
        </div>
      )}
    </>
  );
}

export default App;
