// vim: noexpandtab
// The class for the EditPage
function EditPage() {

	// Member functions:
	// Public functions:
	//  - edit_file: Open the given team, project and file path.
	//  - new_file: Create a new edit tab with no filename.
	//  - rename_tab: Rename a tab's parent object.
	//  - close_all_tabs: Close all the tabs, prompting for a save if needed.

	// Private functions:
	//  - _init: Initialises the edit page (called on instantiation)
	//  - _show: Show the edit page.
	//	     Triggers initialisation of the editarea if necessary
	//  - _hide: Hide the edit page.
	//  - _new_etab: Creates a new instance of an EditTab and wire it
	//		 up to a Tab
	//		 TODO: Can we get EditTab to do this for us?
	//  - _file_get_etab: Given a file path, returns the tab for it.
	//		      If the file isn't currently open, return null.
	//  - _tab_switch: Handler for the onswitch event of the tab bar.
	//		   TODO: Make this remove the tab from our list.
	//  - _is_edit: Returns try if the given tab is an edit tab

	// Private properties:
	// Dict of open files.  Keys are paths, values are EditTab instances.
	this._open_files = {};

	this.textbox = null;
	this._iea = null;

	// The number of new files so far
	this._new_count = 0;

	// Initialise the edit page
	this._init = function() {
		connect( tabbar, "onswitch", bind( this._tab_switch, this ) );

		this.textbox = getElement('editpage-acebox');
		connect( window, 'onresize', bind(this._window_resize, this) );

		this._iea = new ide_editarea('editpage-acebox');
	}

	// Resize the edit box to cope.
	this._window_resize = function() {
		// only if there's an edit box shown
		var dispStyle = getStyle('edit-mode', 'display');
		if (dispStyle == 'none') {
			return;
		}

		// prevElem should be the menu bar
		var prevElem = getElement('editpage-menu-bar');

		var dims = getElementDimensions(prevElem);
		var pos = getElementPosition(prevElem);
		var marginBottom = getStyle(prevElem, 'margin-bottom');
		marginBottom = parseInt(marginBottom);

		var aboveHeight = pos.y + dims.h + marginBottom;
		setStyle(this.textbox, {'top': aboveHeight + 'px'});
	}

	// Show the edit page
	this._show = function() {
		showElement('edit-mode');
		this._window_resize();
	}

	// Hide the edit page
	this._hide = function() {
		hideElement('edit-mode');
	}

	// Mark the given errors in the named file
	this.mark_errors = function( file, errors ) {
		if (!this.is_open(file))
			return;

		var etab = this._file_get_etab(file);
		etab.mark_errors(errors);
	}

	//Is the given file open?
	this.is_open = function( file ) {
		return this._open_files[file] != null;
	}

	// Open the given file and switch to the tab
	// or if the file is already open, just switch to the tab
	this.edit_file = function( team, project, path, rev, mode ) {
		// TODO: We don't support files of the same path being open in
		// different teams at the moment.
		var etab = this._file_get_etab( path );
		var newTab = false;

		if( etab == null ) {
			var readOnly = projpage.project_readonly(project);
			etab = this._new_etab( team, project, path, rev, readOnly, mode );
			newTab = true;
		}

		tabbar.switch_to( etab.tab );

		// If they've specified a revision then change to it
		// NB: we need to do this *after* switching to the tab so that it's shown, otherwise editarea explodes
		if ( !newTab && rev != null ) {
			etab.open_revision(rev, false);
		}
		return etab;
	}

	// Create a new tab with a new file open in it
	this.new_file = function() {
		if (!validate_team()) {
			return;
		}
		if(!projpage.projects_exist()) {
			status_msg("You must create a project before creating a file", LEVEL_ERROR);
			return;
		}
		this._new_count ++;
		var fname = "New File " + this._new_count;
		var etab = this._new_etab( team, null, fname, 0, false );
		tabbar.switch_to( etab.tab );
	}

	this.rename_tab = function(old, New) {
		this._open_files[New] = this._open_files[old];
		this._open_files[old] = null;
		this._open_files[New].tab.set_label( New );
	}

	//close a tab, if it's open, return true if it's closed, false otherwise
	this.close_tab = function(name, override) {
		if(this.is_open(name))
			return this._open_files[name].close(override);
		else
			return true;
	}

	this.close_all_tabs = function(override) {
		mod_count	= 0;
		for ( var i in this._open_files ) {	//find which are modified and close the others
			if(this._open_files[i] !== null) {
				logDebug('checking '+i);
				if(this._open_files[i].is_modified() && override != true) {
					logDebug(i+' is modified, logging');
					mod_count	+= 1;
					mod_file	= i;
				} else {
					logDebug('closing '+i);
					this._open_files[i].close(override);
				}
			}
		}
		if(mod_count > 0) {
			if(mod_count == 1)
				this._open_files[mod_file].close(false);
			else
				status_button(mod_count+' files have been modified!', LEVEL_WARN, 'Close Anyway', bind(this.close_all_tabs, this, true));
			return false;
		} else
			return true;
	}

	// Create a new tab that's one of ours
	// Doesn't load the tab
	this._new_etab = function(team, project, path, rev, isReadOnly, mode) {
		var etab = new EditTab(this._iea, team, project, path, rev, isReadOnly, mode);

		connect( etab, "onclose", bind( this._on_tab_close, this ) );

		this._open_files[path] = etab;
		return etab;
	}

	// Return the tab for the given file path
	// returns null if not open
	this._file_get_etab = function( path ) {
		for( var i in this._open_files ) {
			if( i == path && this._open_files[i] !== null )
				return this._open_files[i];
		}
		return null;
	}

	// Handler for when the tab has been closed
	this._on_tab_close = function( etab ) {
		// Remove tab from our list
		for( var i in this._open_files ) {
			if( this._open_files[i] === etab ) {
				this._open_files[i] = null;
				break;
			}
		}
	}

	this._tab_switch = function( fromtab, totab ) {
		if( !this._is_edit( totab ) ) {
			this._hide();
			return;
		}

		if( !this._is_edit( fromtab ) )
			this._show();
	}

	// Return true if the given tab is an edit tab
	this._is_edit = function(tab) {
		if( tab !== null && tab !== undefined
		    && tab.__edit === true )
			return true;
		return false;
	}

	this._init();

}

// Represents a tab that's being edited
// Managed by EditPage -- do not instantiate outside of EditPage
function EditTab(iea, team, project, path, rev, isReadOnly, mode) {
	// Member functions:
	// Public:
	//  - close: Handler for when the tab is closed: check the contents of the file then close
	//  - is_modified: are the contents of the file modified compared to the original.
	// Private:
	//  - _init: Constructor.
	//  - _check_syntax: Handler for when the "check syntax" button is clicked
	//  - _update_contents: Update the contents of the edit area.
	//  - _show_contents: Update that edit page such that this tab's content is shown
	//  - _capture_code: Store the contents of the edit area.

	//  ** File Contents Related **
	//  - _load_contents: Start the file contents request.
	//  - _recv_contents: Handler for file contents reception.
	//  - _recv_contents_err: Handler for file contents reception errors.

	//  ** Save Related **
	//  - _save: Handler for when the save button is clicked.
	//  - _receive_new_fname: Handler for save dialog.
	//  - _receive_commit_msg: Handler for save dialog.
	//  - _repo_save: Save the file to the server.
	//  - _receive_repo_save: Handler for successfully sending to server.
	//  - _error_receive_repo_save: Handler for when a save fails.

	//  ** Tab related **
	//  - _close: Actually close the tab.
	//  - _onfocus: Handler for when the tab receives focus.
	//  - _onblur: Handler for when the tab is blurred.

	// *** Public Properties ***
	if (rev == null || rev == undefined)
		this.rev = 'HEAD';
	else
		this.rev = rev;

	// The team
	this.team = team;
	// The project
	this.project = project;
	// The path
	this.path = path;
	// The current contents
	this.contents = "";
	// The tab representing us
	this.tab = null;

	// *** Private Properties ***
	//true if file is new (unsaved)
	this._isNew = false;
	//The commit message
	this._commitMsg = "Default Commit Message";
	//the original contents (before edits)
	this._original = "";
	// All our current signal connection idents
	this._signals = [];
	// The "Failed to load contents" of file status message:
	this._stat_contents = null;
	// the ide_editarea instance
	this._iea = iea;
	// the ace session for this tab
	this._session = this._iea.newSession();
	// are we currently setting the session document value?
	// used to avoid responding to change notifications during updates
	this._settingValue = false;
	//this will host the delay for the autosave
	this._timeout = null;
	//the time in seconds to delay before saving
	this._autosave_delay = 25;
	this._autosave_retry_delay = 7;
	//the contents at the time of the last autosave
	this._autosaved = "";
	// Whether the file is opened read-only
	this._read_only = isReadOnly;
	// whether we're loading from the vcs repo or an autosave
	this._mode = mode;

	// Have we completed our initial load of the file contents?
	this._loaded = false;
	this._after_load_actions = [];

	this._init = function() {
		this.tab = new Tab( this.path );
		tabbar.add_tab( this.tab );

		// Mark the tab as a edit tab
		this.tab.__edit = true;

		connect( this.tab, "onfocus", bind( this._onfocus, this ) );
		connect( this.tab, "onblur", bind( this._onblur, this ) );
		connect( this.tab, "onclickclose", bind( this.close, this, false ) );

		// change events from our editor
		this._session.on( 'change', bind( this._on_change, this ) );

		if( this.project == null ) {
			// New file
			this._isNew = true;
			this.contents = "";
			this._original = "";
			getElement("check-syntax").disabled = true;
			getElement("edit-diff").disabled = true;
		} else {
			// Existing file
			this._load_contents();
			getElement("check-syntax").disabled = false;
			getElement("edit-diff").disabled = false;
		}
	}

	// Start load the file contents
	this._load_contents = function() {
		IDE_backend_request("file/get", { team : this.team,
		                   project: this.project,
						   path : IDE_path_get_file(this.path),
						   rev : this.rev },
						   bind(this._recv_contents, this),
						   bind(this._recv_contents_err, this));
	}

	// Handler for the reception of file contents
	this._recv_contents = function(nodes) {
		var first_load = !this._loaded;
		this._loaded = true;
		this._isNew = false;
		this._original = nodes.original;
		this._autosaved = nodes.autosaved || null;

		if (this._mode == 'AUTOSAVE') {
			this.contents = this._autosaved || this._original;
		} else {
			this.contents = this._original;
		}

		this._update_contents();
		this._show_contents();
		this._show_modified();

		if (first_load) {
			for (var i=0; i < this._after_load_actions.length; i++) {
				var action = this._after_load_actions[i];
				action();
			}
			this._after_load_actions = null;
		}
	}

	// Handler for errors in receiving the file contents
	this._recv_contents_err = function() {
		this._stat_contents = status_button( "Failed to load contents of file " + this.path,
						     LEVEL_ERROR,
						     "retry", bind( this._load_contents, this ) );
	}

	this._check_syntax = function() {
		//tell the log and grab the latest contents
		logDebug( "Checking syntax of " + this.path );

		// get the errors page to run the check, after autosaving the file.
		this._autosave(
			bind( errorspage.check, errorspage, this.path, { alert: true },true ),
			partial( status_button, "Unable to check syntax", LEVEL_WARN,
				"retry", bind(this._check_syntax, this) )
		);
	}

	this._diff = function() {
		//tell the log and grab the latest contents
		log( "Showing diff of " + this.path );
		this._capture_code();

		//throw the contents to the diff page, if changed
		if(this._original != this.contents)
			diffpage.diff(this.path, this.rev, this.contents);
		else
			status_msg("File not modified", LEVEL_OK);

	}

	this._receive_new_fname = function(fpath, commitMsg) {
		var a = fpath.split( "/", 2 );

		if (a.length == 2 ) {
			editpage.rename_tab(this.path, fpath);
			this.project = a[1];
			this.path = fpath;
			this._commitMsg = commitMsg;
			this._repo_save();
		} else
			status_msg( "No project specified", LEVEL_ERROR );
	}

	this._receive_commit_msg = function(commitMsg) {
		this._commitMsg = commitMsg;
		this._repo_save();
	}

	this._save = function() {
		//do an update
		this._capture_code();

		//no point saving an unmodified file
		if(this._original == this.contents) {
			log('File not modified!');
			status_msg("File not modified!", LEVEL_WARN);
			return;
		}

		//if new file	-- TODO
		if(this._isNew) {
			var fileBrowser = new Browser(bind(this._receive_new_fname, this), {'type' : 'isFile'});
		} else {
			var fileBrowser = new Browser(bind(this._receive_commit_msg, this), {'type' : 'isCommit'});
			fileBrowser.showDiff(this.path, this.rev, this.contents);
		}
	}

	//ajax event handler for saving to server
	this._receive_repo_save = function(nodes){
		projpage.flist.refresh();

		if (nodes.merges.length == 0) {
			status_msg("File "+this.path+" Saved successfully (Now at "+nodes.commit+")", LEVEL_OK);
			this._original = this.contents;
			this.tab.set_label(this.path);
			this._autosaved = "";
			if (user.get_setting('save.autoerrorcheck') != false)
			{
				errorspage.check(this.path, { alert: true, quietpass: true }, false);
			}
		} else {
			status_msg("File "+this.path+" Merge required, please check and try again (Now at "+nodes.commit+")", LEVEL_ERROR);
			this.contents = nodes.code;
		}
		this._isNew = false;
		this.rev = nodes.commit;
		getElement("check-syntax").disabled = false;
		getElement("edit-diff").disabled = false;
		this._update_contents();
	}

	//ajax event handler for saving to server
	this._error_receive_repo_save = function() {
		status_button("Could not save file", LEVEL_ERROR, "retry", bind(this._repo_save, this));
	}

	//save file contents to server as new revision
	this._repo_save = function() {
		IDE_backend_request("file/put", {team: team,
		                                 project: IDE_path_get_project(this.path),
		                                 path: IDE_path_get_file(this.path),
		                                 data: this.contents},
		                    bind(function() {
		                    	IDE_backend_request("proj/commit", {team: team,
		                    	                                 project: IDE_path_get_project(this.path),
                                                                 paths: [IDE_path_get_file(this.path)],
		                    	                                 message: this._commitMsg},
		                    	                                 bind(this._receive_repo_save, this),
		                    	                                 bind(this._error_receive_repo_save, this));

		                    }, this),
		                    bind(this._error_receive_repo_save, this));
	}

	this._on_keydown = function(ev) {
		//since this call could come from EditArea we have to disregard mochikit nicities
		if(ev != 'auto' && typeof ev._event == 'object')
			var e = ev._event;
		else
			var e = ev;

		//Ctrl+s or Cmd+s: do a save
		if( (e.ctrlKey || e.metaKey) && e.keyCode == 83 ) {
			this._save();
			// try to prevent the browser doing something else
			kill_event(ev);
		}
	}

	this._on_change = function(e) {
		if (!this._settingValue) {
			this._show_modified();

			// Trigger an autosave
			if( this._timeout != null )
				this._timeout.cancel();
			if( e == 'auto' )
				var delay = this._autosave_retry_delay;
			else
				var delay = this._autosave_delay;
			this._timeout = callLater(delay, bind(this._autosave, this));
		}
	}

	//called when the code in the editarea changes. TODO: get the autosave to use this interface too
	this._on_keyup = function() {
		this._show_modified();
	}

	this._show_modified = function() {
		//Handle modified notifications
		if( this.is_modified() ) {
			this.tab.set_label("*" + this.path);
		} else {
			this.tab.set_label(this.path);
		}
	}

	this._autosave = function(cb, errCb) {
		var cb = cb || null;
		var errCb = errCb || bind(this._on_keydown, this, 'auto');
		this._timeout = null;
		// do an update (if we have focus) and check to see if we need to autosave
		if(this.tab.has_focus())
		{
			this._capture_code();
		}

		// If there's no change and no callback then bail
		if( (this.contents == this._original || this.contents == this._autosaved)
		  && cb == null )
		{
			return;
		}

		logDebug('EditTab: Autosaving '+this.path);

		IDE_backend_request("file/put", {team: team,
		                                 project: this.project,
		                                 path: IDE_path_get_file(this.path),
		                                 rev: this.rev,
		                                 data: this.contents},
		                                 bind(this._receive_autosave, this, this.contents, cb),
		                                 errCb);
	}

	//ajax event handler for autosaving to server, based on the one for commits
	this._receive_autosave = function(code, cb){
		this._autosaved = code;
		projpage.flist.refresh('auto');
		if (typeof cb == 'function') {
			cb();
		}
	}

	this.is_modified = function() {
		if(this.tab.has_focus())	//if we have focus update the code
			this._capture_code();

		if(this.contents != this._original)	//compare to the original
			return true;
		else
			return false;
	}

	//try to close a file, checking for modifications, return true if it's closed, false if not
	this.close = function(override) {
		if( override != true && this.is_modified() ) {
			tabbar.switch_to(this.tab);
			status_button(this.path+" has been modified!", LEVEL_WARN, "Close Anyway", bind(this._close, this));
			return false;
		} else {
			this._close();
			return true;
		}
	}

	//actually close the tab
	this._close = function() {
		signal( this, "onclose", this );
		this.tab.close();
		this._session.removeAllListeners('change');
		disconnectAll(this);
		status_hide();
	}

	// Handler for when the tab receives focus
	this._onfocus = function() {
		// Close handler
		this._signals.push( connect( "close-edit-area",
					     "onclick",
					     bind( this.close, this, false ) ) );
		// Check syntax handler
		var checkSyntaxElem = getElement("check-syntax");
		if(this._isNew) {
			checkSyntaxElem.disabled = true;
		} else {
			checkSyntaxElem.disabled = false;
		}
		this._signals.push( connect( checkSyntaxElem,
					     "onclick",
					     bind( this._check_syntax, this ) ) );

		// Diff view handler
		var diffElem = getElement('edit-diff');
		diffElem.disabled = this._read_only || this._isNew;
		if (!this._read_only) {
			this._signals.push( connect(diffElem,
			                            'onclick',
			                            bind(this._diff, this))
			                  );
		}
		// Save handler
		var saveElem = getElement('save-file');
		saveElem.disabled = this._read_only;
		if (!this._read_only) {
			this._signals.push( connect(saveElem,
			                            'onclick',
			                            bind(this._save, this))
			                  );
		}
		// change revision handler
		this._signals.push( connect( "history",
					     "onclick",
					     bind( this._change_revision, this ) ) );

		// keyboard shortcuts
		this._signals.push( connect( document,
					    "onkeydown",
					    bind( this._on_keydown, this ) ) );

		this._show_contents();
		this._iea.setReadOnly(this._read_only);
		this._iea.focus();
	}

	// Handler for when the tab loses focus
	this._onblur = function() {
		// Disconnect all the connected signal
		map( disconnect, this._signals );
		this._signals = [];

		//don't loose changes to file content
		this._capture_code();
	}

	this._update_contents = function() {
		this._settingValue = true;
		this._session.setValue( this.contents );
		this._settingValue = false;
	}

	this._show_contents = function() {
	 	this._get_revisions();

		this._iea.setSession( this._session );

		// Display file path
		var t = this.path;
		if( this.rev != 0 )
			t = t + " - " + IDE_hash_shrink(this.rev);
		if (this._read_only)
			t += ' [read-only]';
		replaceChildNodes( "tab-filename", t );
	}

	//call this to update this.contents with the current contents of the edit area and to grab the current cursor position
	this._capture_code = function() {
		this.contents = this._session.getValue();
	}

	this._change_revision = function() {
		var rev = getElement("history").value;
		switch(rev) {
		case "-2":
			var d = new Log(this.path);
			break;
		case "-1":
			break;
		default:
			this.open_revision(rev, false)
		}
	}

	this.open_revision = function(rev, override) {
		this._capture_code();
		if( override != true && this.contents != this._original ) {
			status_button(this.path + " has been modified!", LEVEL_WARN,
				"Go to revision " + IDE_hash_shrink(rev) + " anyway",
				bind(this.open_revision, this, rev, true)
			);
		} else {
			this._mode = 'REPO';
			this.rev = rev;
			status_msg("Opening history .. " + rev, LEVEL_OK);
			this._load_contents();
		}
	}

	this._receive_revisions = function(nodes) {
		var histDate = function(which) {
			var stamp = nodes.log[which].time;
			var d = new Date(stamp*1000);
			return d.toDateString();
		}

		if(nodes.log.length == 0) {
			replaceChildNodes("history", OPTION({'value' : -1}, "No File History!"));
		} else {
			replaceChildNodes("history", OPTION({'value' : -1}, "Select File Revision"));
			for(var i=0; i < nodes.log.length; i++) {
				var author = nodes.log[i].author;
				var pos = author.lastIndexOf('<');
				if (pos >= 0) {
					author = author.substring(0, pos-1);
				}
				appendChildNodes("history",
					OPTION( { value: nodes.log[i].hash, title: nodes.log[i].message },
						IDE_hash_shrink(nodes.log[i].hash) +
						" " + histDate(i) + " [" + author + "]"
					)
				);
			}

			appendChildNodes("history", OPTION({'value' : -2}, "--View Full History--"));
		}
	}

	this._error_receive_revisions = function() {
		status_msg("Couldn't retrieve file history", LEVEL_ERROR);
	}

	this._get_revisions = function() {
		logDebug("retrieving file history");
		this._receive_revisions({log: []});
		// Don't even try to get revisions if we know that it's a new file
		if(this._isNew) {
			return;
		}
        IDE_backend_request('file/log', {
                team: team,
             project: IDE_path_get_project(this.path),
                path: IDE_path_get_file(this.path)
            },
            bind(this._receive_revisions, this),
            bind(this._error_receive_revisions, this)
        );
    }

	// Sets the selection in the editor as a line relative position.
	// If length is -1 this is treated as the end of the line.
	// If length would push the selection onto multiple lines its value is truncated to the end of the current line.
	// Note that lines are indexed from 1.
	this.setSelectionRange = function(lineNumber, startIndex, length) {
		if (this._loaded) {
			this._setSelectionRange(lineNumber, startIndex, length);
		} else {
			this._after_load_actions.push(bind(this._setSelectionRange, this, lineNumber, startIndex, length));
		}
	}

	this._setSelectionRange = function(lineNumber, startIndex, length) {
		var Range = require("ace/range").Range;
		lineNumber -= 1;
		var endIndex = startIndex + length;
		if (endIndex == -1) {
			var lineText = this._session.getLine(lineNumber);
			if (lineText != null) {
				endIndex = lineText.length;
			}
		}
		var range = new Range(lineNumber, startIndex, lineNumber, endIndex);
		this._iea.setSelectionRange(range);
	}

	// Marks the given set of errors in the editor.
	this.mark_errors = function(errors) {
		var annotations = [];
		for ( var i=0; i < errors.length; i++) {
			var error = errors[i];
			annotations.push({ row: error.lineNumber - 1,
			                column: 0,
			                  text: error.message,
			                  type: error.level });
		}
		this._session.setAnnotations(annotations);
	}

	// Clears all the marked errors from the editor
	this.clear_errors = function() {
		this._session.clearAnnotations();
	}

	//initialisation
	this._init();
}

/// A wrapper around our editor of choice.
/// This used to be editarea, which needed coddling to prevent it exploding (hence the name).
function ide_editarea(id) {
	// Public functions:
	//  - getSelectionRange() -- get the cursor selection range, no need to pass the id, load safe
	//  - setSelectionRange() -- set the cursor selection range, no need to pass the id, load safe

	// Public properties:
	this._id = id;
	this._open_queue = [];
	this._close_queue = [];
	this._value = null;
	this._ace = null;	// An ACE Editor instance

	this._init = function() {
		this._ace = ace.edit( this._id );
	}

	this.newSession = function() {
		var PythonMode = require( "ace/mode/python" ).Mode;
		var UndoManager = require("ace/undomanager").UndoManager;
		var EditSession = require( "ace/edit_session" ).EditSession;
		var session = new EditSession( "" , new PythonMode );
		session.setUndoManager( new UndoManager );
		this._ace.setSession( session );
		return session;
	}

	this.setSession = function( session ) {
		if( session != null ) {
			this._ace.setSession( session );
		}
	}

	this.setSelectionRange = function( range ) {
		if( range != null ) {
			this._ace.selection.setSelectionRange( range );
		}
	}

	this.setReadOnly = function(isReadOnly) {
		this._ace.setReadOnly(isReadOnly);
		setReadOnly(this._id, isReadOnly);
	}

	this.focus = function() {
		return this._ace.focus();
	}

	this._init();
}
