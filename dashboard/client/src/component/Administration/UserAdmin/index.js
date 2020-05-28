import React from "react";
import * as actions from "../../../store/actions/index";
import * as actionTypes from "../../../store/actions/actionTypes";
import { connect } from "react-redux";
import Modal from 'react-bootstrap-modal'
import axios from "../../../api";

import deleteIcon from "./../../../images/delete.svg";
import editIcon from "./../../../images/edit.svg";
import 'react-accessible-accordion/dist/fancy-example.css';
import {
    Form, FormGroup, TextInput, TextArea, Select, SelectItem, MultiSelect,
    Checkbox,
    DataTable,
    TableContainer,
    Tabs, Tab,
    Table, TableSelectAll, TableSelectRow,
    TableHead, TableRow, TableHeader, TableBody, TableCell,
    TableToolbar, TableBatchActions, TableBatchAction, TableToolbarContent,
    TableToolbarMenu, TableToolbarSearch, TableToolbarAction, Button
} from "carbon-components-react";

import _ from "lodash";
import { element } from "prop-types";

let thisObject = null;

let userMapping = {}
let moduleMapping = {}
let roleMapping = {}
let userAction = 'create'
let roleAction = 'create'
// We would have a headers array like the following
const userDataHeaders = [
    {
        key: 'name',
        header: 'User Name'
    },
    {
        key: 'userid',
        header: 'User ID/Mail ID'
    },
    {
        key: 'role',
        header: 'Role(s)',
    },
    {
        key: 'siteAccess',
        header: 'Site(s) Access',
    }
];

const userRoleDataHeaders = [
    {
        key: 'name',
        header: 'Role Name'
    },
    {
        key: 'description',
        header: 'Description'
    },
    {
        key: 'moduleAccess',
        header: 'Module(s) Access',
    }
];

class UserAdmin extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            sites: [],
            userData: [],
            userRoleData: [],
            moduleData: [],
            showCreateUserPane: false,
            showCreateRolePane: false,
            roleDataInAction: { modules: [] },
            userDataInAction: { roles: [], sites: [] },
            userDataInAction: {}
        };
        thisObject = this;
    }

    componentDidMount() {
        this.fetchAllModules();
        this.fetchAllSites();
        this.fetchAllUsers();
        this.fetchAllRoles();
    }
    componentDidUpdate = prevProp => {

    };
    fetchAllModules = () => {
        const url = '/layout/site?preventCache=' + this.randomNumber();
        axios.get(url).then((res) => {
            thisObject.setState({ sites: res.data });
        }).catch((err) => {
            console.log(err.message);
        });
    }
    fetchAllSites = () => {
        const url = '/role/module/all?preventCache=' + this.randomNumber();
        axios.get(url).then((res) => {
            let modules = [];
            res.data.forEach((module) => {
                let moduleData = { id: module.module_id, name: module.module_name, description: module.module_description }
                modules.push(moduleData);
                moduleMapping[module.module_id] = moduleData;
            })
            thisObject.setState({ moduleData: modules });
        }).catch((err) => {
            console.log(err.message);
        });
    }
    fetchAllUsers = () => {
        const url = '/user/all?preventCache=' + this.randomNumber();
        axios.get(url).then((res) => {
            let users = [];
            res.data.forEach((user) => {
                let roles = []
                user.dhl_roles.forEach((role) => { roles.push(role.role_name) });
                let userData = { id: user.user_id, name: user.user_name, userid: user.email, roles: user.dhl_roles, role: roles.toString(), siteId: user.site_id, siteAccess: user.dhl_site.city }
                users.push(userData);
                userMapping[user.user_id] = userData;
            })
            thisObject.setState({ userData: users });
        }).catch((err) => {
            console.log(err.message);
        });
    }
    randomNumber = (min, max) => {
        return Math.random() * (max - min) + min;
    };
    fetchAllRoles = () => {
        const url = '/role/all?preventCache=' + this.randomNumber();
        axios.get(url).then((res) => {
            let roles = [];
            res.data.forEach((role) => {
                let modules = []
                role.dhl_modules.forEach((module) => {
                    modules.push((moduleMapping[module.module_id] !== null && moduleMapping[module.module_id] !== undefined) ? moduleMapping[module.module_id].description : module.module_name)
                });
                let userRoleData = { id: role.role_id, name: role.role_name, description: role.role_description, modules: role.dhl_modules, moduleAccess: modules.toString() }
                roles.push(userRoleData);
                roleMapping[role.role_id] = userRoleData;
            })
            thisObject.setState({ userRoleData: roles });
        }).catch((err) => {
            console.log(err.message);
        });
    }

    randomNumber = (min, max) => {
        if (min === null || min === undefined || max === null || max === undefined) {
            min = 0; max = 999999999;
        }
        return Math.random() * (max - min) + min;
    };
    showCreateUserPane = (evt) => {
        userAction = 'create';
        this.setState({
            userDataInAction: {
                name: '',
                userid: '',
                sites: [],
                roles: []
            },
            showCreateUserPane: true
        });
    }
    closeCreateUserPane = (evt) => {
        this.setState({ showCreateUserPane: false });
    }
    userNameChange = (evt) => {
        let modifiedData = { ...this.state.userDataInAction }
        modifiedData.name = evt.target.value;
        this.setState({ userDataInAction: modifiedData })
    }
    userIdChange = (evt) => {
        let modifiedData = { ...this.state.userDataInAction }
        modifiedData.userid = evt.target.value;
        this.setState({ userDataInAction: modifiedData })
    }
    onUserRoleChange = (evt) => {
        let modifiedData = { ...this.state.userDataInAction }
        modifiedData.roles = evt.selectedItems;
        this.setState({ userDataInAction: modifiedData })
    }
    onSiteAccessChange = (evt) => {
        let modifiedData = { ...this.state.userDataInAction }
        modifiedData.sites = evt.selectedItems;
        this.setState({ userDataInAction: modifiedData })
    }
    showCreateRolePane = (evt) => {
        roleAction = 'create';
        this.setState({
            roleDataInAction: {
                name: '',
                description: '',
                modules: []
            },
            showCreateRolePane: true
        });
    }
    closeCreateRolePane = (evt) => {
        this.setState({ showCreateRolePane: false });
    }
    roleNameChange = (evt) => {
        let modifiedData = { ...this.state.roleDataInAction }
        modifiedData.name = evt.target.value;
        this.setState({ roleDataInAction: modifiedData })
    }
    roleDescriptionChange = (evt) => {
        let modifiedData = { ...this.state.roleDataInAction }
        modifiedData.description = evt.target.value;
        this.setState({ roleDataInAction: modifiedData })
    }
    roleModuleAccessChange = (evt) => {
        let modifiedData = { ...this.state.roleDataInAction }
        modifiedData.modules = evt.selectedItems;
        this.setState({ roleDataInAction: modifiedData })
    }
    editUser = (evt) => {
        userAction = 'update';
        const userId = evt.target.id.substring(10);
        const userData = userMapping[userId];
        let roles = [];
        let sites = [];
        userData.roles.map((role) => {
            roles.push(roleMapping[role.role_id]);
        })
        this.state.sites.map((site) => {
            if(site.site_id === userData.siteId){
                sites.push(site);
            }
        })
        this.setState({
            userDataInAction: {
                user_id: userId,
                name: userData.name,
                userid: userData.userid,
                roles: roles,
                sites: sites
            },
            showCreateUserPane: true
        });
    }
    saveUser = (evt) => {
        let roles = [];
        this.state.userDataInAction.roles.forEach((role) => {
            roles.push({ role_id: role.id })
        })
        const modifiedData = {
            user_name: this.state.userDataInAction.name,
            site_id: this.state.userDataInAction.sites[0].site_id,
            email: this.state.userDataInAction.userid,
            action: userAction,
            dhl_user_roles: roles
        }
        if(userAction === 'update'){
            modifiedData['user_id'] = this.state.userDataInAction.user_id;
            modifiedData['dhl_user_role'] = roles;
        }
        let url = '/user/update';
        axios.post(url, modifiedData).then((res) => {
            this.fetchAllUsers()
            this.setState({ showCreateUserPane: false })
        }).catch((err) => {
            console.log(err.message);
        });
    }
    editRole = (evt) => {
        roleAction = 'update';
        const roleId = evt.target.id.substring(10);
        const roleData = roleMapping[roleId];
        let modules = []
        roleData.modules.forEach((module) => {
            modules.push(moduleMapping[module.module_id])
        })
        this.setState({
            roleDataInAction: {
                role_id: roleId,
                name: roleData.name,
                description: roleData.description,
                modules: modules
            },
            showCreateRolePane: true
        });
    }
    saveUserRole = (evt) => {
        let modules = [];
        this.state.roleDataInAction.modules.forEach((module) => {
            modules.push({ module_id: module.id })
        })
        const modifiedData = {
            role_name: this.state.roleDataInAction.name,
            role_description: this.state.roleDataInAction.description,
            action: roleAction,
            dhl_role_modules: modules
        }
        if(roleAction === 'update'){
            modifiedData['role_id'] = this.state.roleDataInAction.role_id;
            modifiedData['dhl_role_module'] = modules
        }
        let url = '/role/update';
        axios.post(url, modifiedData).then((res) => {
            this.fetchAllRoles()
            this.setState({ showCreateRolePane: false })
        }).catch((err) => {
            console.log(err.message);
        });
    }
    deleteUser = (evt) => {
        const userId = evt.target.id.substring(12);
        const modifiedData = {
            user_id: userId,
            action: 'delete'
        }
        let url = '/user/update';
        axios.post(url, modifiedData).then((res) => {
            this.fetchAllUsers()
        }).catch((err) => {
            console.log(err.message);
        });
    }
    deleteRole = (evt) => {
        const roleId = evt.target.id.substring(12);
        const modifiedData = {
            role_id: roleId,
            action: 'delete'
        }
        let url = '/role/update';
        axios.post(url, modifiedData).then((res) => {
            this.fetchAllRoles()
        }).catch((err) => {
            console.log(err.message);
        });
    }
    render() {
        return (
            <div>
                <div className='userAdminContainer'>
                    <div className='leftPane'>
                        <div className='SysProp' style={{height:'100%'}}>
                            <div style={{ padding: '1rem', display: (this.state.showCreateUserPane ? 'block' : 'none') }}>
                                <Form>
                                    <FormGroup>
                                        <TextInput
                                            id="useradmin_name"
                                            labelText="User Name"
                                            placeholder="Enter user name"
                                            value={this.state.userDataInAction.name}
                                            onChange={this.userNameChange}
                                        />
                                        {/*<table style={{ width: '100%' }}><tbody><tr>
                                            <td>
                                                <TextInput
                                                    id="useradmin_firstname"
                                                    labelText="First Name"
                                                    placeholder="Enter first name"
                                                />
                                            </td>
                                            <td style={{ paddingLeft: '1rem' }}>
                                                <TextInput
                                                    id="useradmin_lastname"
                                                    labelText="Last Name"
                                                    placeholder="Enter last name"
                                                />
                                            </td>
                                        </tr></tbody></table>*/}
                                    </FormGroup>
                                    <FormGroup>
                                        <TextInput
                                            id="useradmin_userid"
                                            labelText="User ID / Email"
                                            placeholder="Enter user id"
                                            value={this.state.userDataInAction.userid}
                                            onChange={this.userIdChange}
                                        />
                                    </FormGroup>
                                    {this.state.showCreateUserPane ?
                                        <FormGroup>
                                            <table style={{ width: '100%' }}><tbody><tr>
                                                <td>
                                                    <p className='bx--label'>User Roles</p>
                                                    <MultiSelect
                                                        labelText="Last Name"
                                                        initialSelectedItems={this.state.userDataInAction.roles}
                                                        itemToString={function noRefCheck(item) { return item !== null ? item.description : ''; }}
                                                        items={this.state.userRoleData}
                                                        label="Select role(s)"
                                                        onChange={this.onUserRoleChange}
                                                        type="default"
                                                    />
                                                </td>
                                                <td style={{ paddingLeft: '1rem' }}>
                                                    <p className='bx--label'>Site Access</p>
                                                    <MultiSelect
                                                        initialSelectedItems={this.state.userDataInAction.sites}
                                                        itemToString={function noRefCheck(item) { return item !== null ? item.city : ''; }}
                                                        items={this.state.sites}
                                                        label="Select site(s)"
                                                        onChange={this.onSiteAccessChange}
                                                        type="default"
                                                    />
                                                </td>
                                            </tr></tbody></table>
                                        </FormGroup>
                                        : ''}
                                    <div style={{ width: '100%', textAlign: 'right' }}>
                                        <Button
                                            kind="primary"
                                            tabIndex={0}
                                            type="submit"
                                            onClick={this.closeCreateUserPane}
                                            style={{ marginRight: '1rem' }}
                                            className='button'
                                        >
                                            Discard
                                    </Button>
                                        <Button
                                            kind="primary"
                                            tabIndex={1}
                                            type="submit"
                                            onClick={this.saveUser}
                                            className='button'
                                        >
                                            Save
                                    </Button>
                                    </div>
                                </Form>
                            </div>
                            <div style={{ display: (this.state.showCreateUserPane ? 'none' : 'block') }}>
                                <DataTable
                                    rows={this.state.userData}
                                    headers={userDataHeaders}
                                    overflowMenuOnHover={false}
                                    render={({
                                        rows,
                                        headers,
                                        getHeaderProps,
                                        onInputChange
                                    }) => (
                                            <TableContainer title="User to role mapping" className='user_role_mapping_table'>
                                                <TableToolbar>
                                                    <TableToolbarContent>
                                                        <TableToolbarSearch onChange={onInputChange} />
                                                        <Button className='button' onClick={this.showCreateUserPane} small kind="primary">
                                                            + Add User
                                                                </Button>
                                                    </TableToolbarContent>
                                                </TableToolbar>
                                                <Table useZebraStyles size='compact'>
                                                    <TableHead>
                                                        <TableRow>
                                                            {/*<TableSelectAll {...getSelectionProps()} />*/}
                                                            {headers.map(header => (
                                                                <TableHeader {...getHeaderProps({ header })}>
                                                                    {header.header}
                                                                </TableHeader>
                                                            ))}
                                                            <TableHeader>
                                                                {''}
                                                            </TableHeader>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {rows.map(row => (
                                                            <TableRow key={row.id}>
                                                                {/*<TableSelectRow {...getSelectionProps({ row })} />*/}
                                                                {row.cells.map(cell => (
                                                                    <TableCell key={cell.id}>{cell.value}</TableCell>
                                                                ))}
                                                                <TableCell>
                                                                    <img id={'user_edit_' + (row.id)} onClick={(evt) => { this.editUser(evt) }} src={editIcon} />
                                                                    <img id={'user_delete_' + (row.id)} style={{ marginLeft: '1rem' }} onClick={(evt) => { this.deleteUser(evt) }} src={deleteIcon} />
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>)}
                                />
                            </div>

                        </div>
                    </div>
                    <div className='rightPane'>
                        <div className='SysProp' style={{height:'100%'}}>
                            <div style={{ padding: '1rem', display: (this.state.showCreateRolePane ? 'block' : 'none') }}>
                                <Form>
                                    <FormGroup>
                                        <TextInput
                                            id="roleadmin_name"
                                            labelText="Role Name"
                                            placeholder="Enter role name"
                                            value={this.state.roleDataInAction.name}
                                            onChange={this.roleNameChange}
                                        />
                                    </FormGroup>
                                    <FormGroup>
                                        <TextInput
                                            id="roleadmin_description"
                                            labelText="Description"
                                            placeholder="Enter description"
                                            value={this.state.roleDataInAction.description}
                                            onChange={this.roleDescriptionChange}
                                        />
                                    </FormGroup>
                                    {this.state.showCreateRolePane ?
                                        <FormGroup>
                                            <p className='bx--label'>Modules</p>
                                            <MultiSelect
                                                id="role_module_access_id"
                                                items={this.state.moduleData}
                                                initialSelectedItems={this.state.roleDataInAction.modules}
                                                itemToString={function noRefCheck(item) { return item !== null ? item.description : ''; }}
                                                label="Select module(s)"
                                                onChange={this.roleModuleAccessChange}
                                            />
                                        </FormGroup>
                                        :
                                        ''}
                                    <div style={{ width: '100%', textAlign: 'right' }}>
                                        <Button
                                            kind="primary"
                                            tabIndex={0}
                                            type="submit"
                                            onClick={this.closeCreateRolePane}
                                            style={{ marginRight: '1rem' }}
                                            className='button'
                                        >
                                            Discard
                                    </Button>
                                        <Button
                                            kind="primary"
                                            tabIndex={1}
                                            type="submit"
                                            onClick={this.saveUserRole}
                                            className='button'
                                        >
                                            Save
                                    </Button>
                                    </div>
                                </Form>
                            </div>
                            <div style={{ display: (this.state.showCreateRolePane ? 'none' : 'block') }}>
                                <DataTable
                                    className='userrole_mapping_table'
                                    rows={this.state.userRoleData}
                                    headers={userRoleDataHeaders}
                                    overflowMenuOnHover={false}
                                    render={({
                                        rows,
                                        headers,
                                        getHeaderProps,
                                        onInputChange
                                    }) => (
                                            <TableContainer title="Role to module mapping" className='user_role_mapping_table'>
                                                <TableToolbar>
                                                    <TableToolbarContent>
                                                        <TableToolbarSearch onChange={onInputChange} />
                                                        <Button className='button' onClick={this.showCreateRolePane} small kind="primary">
                                                            + Add Role
                                                                </Button>
                                                    </TableToolbarContent>
                                                </TableToolbar>
                                                <Table useZebraStyles size='compact'>
                                                    <TableHead>
                                                        <TableRow>
                                                            {/*<TableSelectAll {...getSelectionProps()} />*/}
                                                            {headers.map(header => (
                                                                <TableHeader {...getHeaderProps({ header })}>
                                                                    {header.header}
                                                                </TableHeader>
                                                            ))}
                                                            <TableHeader>
                                                                {''}
                                                            </TableHeader>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {rows.map(row => (
                                                            <TableRow key={row.id}>
                                                                {/*<TableSelectRow {...getSelectionProps({ row })} />*/}
                                                                {row.cells.map(cell => (
                                                                    <TableCell key={cell.id}>{
                                                                        cell.value.split(',').map(item => (
                                                                            <p>{item}</p>
                                                                        ))
                                                                    }</TableCell>
                                                                ))}
                                                                <TableCell>
                                                                    <img id={'role_edit_' + (row.id)} onClick={(evt) => { this.editRole(evt) }} src={editIcon} />
                                                                    <img id={'role_delete_' + (row.id)} style={{ marginLeft: '1rem' }} onClick={(evt) => { this.deleteRole(evt) }} src={deleteIcon} />
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {
        coordinateObj: state.warehouseLayout
    };
};

const mapDispatchToProps = dispatch => {
    return {
        fetchSysProps: siteid => dispatch(actions.fetchSysProps(siteid))
    };
};
export default connect(mapStateToProps, mapDispatchToProps)(UserAdmin);
